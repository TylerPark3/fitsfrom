import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { BRANDS } from '../data/catalog'
import { fileToDataUrl } from '../lib/img'
import { analyzeBody } from '../lib/pose'
import { Upload, Trash } from './Icons'

const GEN_STAGES = [
  'Reading proportions…',
  'Estimating chest & waist…',
  `Mapping your size across ${BRANDS.length} brands…`,
  'Avatar ready',
]

export function PhotoStage({ compact = false }: { compact?: boolean }) {
  const { profile, setProfile, toast } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [gen, setGen] = useState<number | null>(null)

  // Alta-style build moment: stage through the pipeline, then reveal.
  useEffect(() => {
    if (gen === null) return
    if (gen >= GEN_STAGES.length - 1) {
      const t = window.setTimeout(() => {
        setGen(null)
        toast('Avatar ready — every size on the site just updated')
      }, 900)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setGen((g) => (g === null ? null : g + 1)), 750)
    return () => window.clearTimeout(t)
  }, [gen, toast])

  const accept = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('That’s not an image file')
      return
    }
    setBusy(true)
    try {
      const raw = await fileToDataUrl(file, 1400)
      setProfile({ photo: raw, pose: null, photoScale: 1, photoY: 50 })
      setGen(0)
      // Real analysis runs while the scan plays — auto-center + place the pins.
      void analyzeBody(raw).then((r) => {
        if (r)
          setProfile({
            photo: r.photo,
            pose: r.pose,
            photoScale: 1,
            photoY: 50,
            ...(r.face ? { faceX: r.face.x, faceY: r.face.y, faceZoom: Number(r.face.zoom.toFixed(1)) } : {}),
          })
      })
    } catch {
      toast('Couldn’t read that image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="av__stage">
      <div
        className={`av__frame${profile.photo ? ' av__frame--photo' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void accept(e.dataTransfer.files[0])
        }}
      >
        {profile.photo && (
          <img
            src={profile.photo}
            alt="Your full-body reference"
            style={{
              transform: `scale(${profile.photoScale})`,
              objectPosition: `50% ${profile.photoY}%`,
            }}
          />
        )}

        {/* Measurements exist only once there's a body to measure — hover reveals them. */}
        {profile.photo && (
          <>
            <Pin
              top={profile.pose ? `${(profile.pose.chest * 100).toFixed(1)}%` : '27%'}
              left={profile.pose ? `${(profile.pose.cx * 100).toFixed(1)}%` : '50%'}
              width={pinWidth(profile.chest, 30, 56)}
              label={`Chest ${profile.chest}″`}
            />
            <Pin
              top={profile.pose ? `${(profile.pose.waist * 100).toFixed(1)}%` : '42%'}
              left={profile.pose ? `${(profile.pose.cx * 100).toFixed(1)}%` : '50%'}
              width={pinWidth(profile.waist, 26, 48)}
              label={`Waist ${profile.waist}″`}
            />
            <Pin
              top={profile.pose ? `${(profile.pose.inseam * 100).toFixed(1)}%` : '72%'}
              left={profile.pose ? `${(profile.pose.cx * 100).toFixed(1)}%` : '50%'}
              width={pinWidth(profile.inseam, 26, 38, 0.5)}
              label={`Inseam ${profile.inseam}″`}
            />
          </>
        )}

        {gen !== null && (
          <div className="gen" role="status">
            <span className="gen__scan" />
            <div className="gen__pulse" />
            <p className="gen__line" key={gen}>
              {GEN_STAGES[gen]}
            </p>
            <div className="gen__bar">
              <i style={{ width: `${((gen + 1) / GEN_STAGES.length) * 100}%` }} />
            </div>
          </div>
        )}

        {!profile.photo && (
          <label className={`av__drop${over ? ' is-over' : ''}`} style={{ cursor: 'pointer' }}>
            <div>
              <Upload />
              <h4>{busy ? 'Reading photo…' : 'Drop a full-body photo'}</h4>
              <p>
                Straight on, arms slightly out, fitted clothes. It never leaves your browser — no
                upload, no server.
              </p>
              <span className="btn btn--ghost btn--sm">Choose a photo</span>
            </div>
            <input
              ref={input}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void accept(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {profile.photo && !compact && (
        <>
          <div className="av__tools">
            <button className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>
              Replace
            </button>
            <button
              className="btn btn--quiet btn--sm"
              onClick={() => setProfile({ photo: null, photoScale: 1, photoY: 50 })}
            >
              <Trash /> Remove
            </button>
            <input
              ref={input}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void accept(e.target.files?.[0])}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <div className="field__label">
                <span className="tiny">Zoom</span>
              </div>
              <input
                type="range"
                min={1}
                max={2.4}
                step={0.02}
                value={profile.photoScale}
                onChange={(e) => setProfile({ photoScale: +e.target.value })}
                aria-label="Zoom photo"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="field__label">
                <span className="tiny">Vertical position</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={profile.photoY}
                onChange={(e) => setProfile({ photoY: +e.target.value })}
                aria-label="Position photo vertically"
              />
            </div>
          </div>
        </>
      )}

      {profile.photo && compact && (
        <div className="av__tools">
          <button className="btn btn--quiet btn--sm" onClick={() => setProfile({ photo: null })}>
            <Trash /> Remove photo
          </button>
        </div>
      )}
    </div>
  )
}

function pinWidth(value: number, min: number, max: number, cap = 1) {
  const t = (value - min) / (max - min)
  return `${(52 + t * 62) * cap}px`
}

function Pin({ top, left = '50%', width, label }: { top: string; left?: string; width: string; label: string }) {
  return (
    <div className="pin" style={{ top, left }}>
      <div className="pin__rule" style={{ width }}>
        <span className="pin__tag">{label}</span>
      </div>
    </div>
  )
}

