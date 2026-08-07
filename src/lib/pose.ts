/**
 * On-device body analysis: MoveNet pose estimation (TensorFlow.js, lazy-loaded).
 * Finds the person, crops the frame around them, returns pin positions for
 * chest / waist / inseam as fractions of the cropped image. Nothing uploaded.
 */
export interface BodyPose {
  chest: number
  waist: number
  inseam: number
  cx: number
}

export interface FaceCrop {
  x: number
  y: number
  zoom: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

export async function analyzeBody(
  dataUrl: string,
): Promise<{ photo: string; pose: BodyPose; face: FaceCrop | null } | null> {
  try {
    const [tf, pd] = await Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/pose-detection'),
    ])
    await tf.ready()
    const detector = await pd.createDetector(pd.SupportedModels.MoveNet, {
      modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
    })
    const img = await loadImage(dataUrl)
    const poses = await detector.estimatePoses(img)
    detector.dispose()

    const kp = (poses[0]?.keypoints ?? []).filter((k) => (k.score ?? 0) > 0.3)
    if (kp.length < 6) return null

    const pick = (names: string[]) => kp.filter((k) => names.includes(k.name ?? ''))
    const avg = (arr: { y: number }[]) => arr.reduce((n, k) => n + k.y, 0) / arr.length
    const shoulders = pick(['left_shoulder', 'right_shoulder'])
    const hips = pick(['left_hip', 'right_hip'])
    const lower = pick(['left_ankle', 'right_ankle', 'left_knee', 'right_knee'])
    if (!shoulders.length || !hips.length) return null

    const xs = kp.map((k) => k.x)
    const ys = kp.map((k) => k.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const bodyH = Math.max(1, maxY - minY)

    // Frame the body: headroom above, a little float below.
    const top = Math.max(0, minY - bodyH * 0.16)
    const bottom = Math.min(img.height, maxY + bodyH * 0.08)
    const ASPECT = 3 / 4.6
    let ch = bottom - top
    let cw = ch * ASPECT
    if (cw > img.width) {
      cw = img.width
      ch = Math.min(img.height, cw / ASPECT)
    }
    const cxAbs = (minX + maxX) / 2
    const cx0 = Math.min(Math.max(0, cxAbs - cw / 2), img.width - cw)
    const cy0 = Math.min(Math.max(0, top), Math.max(0, img.height - ch))

    const scale = Math.min(1, 900 / ch)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(cw * scale)
    canvas.height = Math.round(ch * scale)
    canvas.getContext('2d')!.drawImage(img, cx0, cy0, cw, ch, 0, 0, canvas.width, canvas.height)
    const photo = canvas.toDataURL('image/jpeg', 0.85)

    const fy = (y: number) => Math.min(0.94, Math.max(0.04, (y - cy0) / ch))
    const shoulderY = avg(shoulders)
    const hipY = avg(hips)
    const ankleY = lower.length ? Math.max(...lower.map((k) => k.y)) : bottom
    const pose: BodyPose = {
      chest: fy(shoulderY + (hipY - shoulderY) * 0.28),
      waist: fy(hipY - (hipY - shoulderY) * 0.05),
      inseam: fy((hipY + ankleY) / 2),
      cx: Math.min(0.88, Math.max(0.12, (cxAbs - cx0) / cw)),
    }

    // Auto face crop: center on the nose, zoom from eye distance.
    let face: FaceCrop | null = null
    const nose = kp.find((k) => k.name === 'nose')
    const le = kp.find((k) => k.name === 'left_eye')
    const re2 = kp.find((k) => k.name === 'right_eye')
    if (nose) {
      const eyeDist = le && re2 ? Math.hypot(le.x - re2.x, le.y - re2.y) : cw * 0.05
      const headW = Math.max(cw * 0.06, eyeDist * 2.6)
      face = {
        x: Math.round(Math.min(96, Math.max(4, ((nose.x - cx0) / cw) * 100))),
        y: Math.round(Math.min(96, Math.max(2, ((nose.y - cy0) / ch) * 100))),
        zoom: Math.min(5, Math.max(1.4, cw / (headW * 2.1))),
      }
    }
    return { photo, pose, face }
  } catch {
    return null
  }
}
