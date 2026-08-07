import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { BRANDS } from '../data/catalog'
import { fileToDataUrl } from '../lib/img'
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
      setProfile({ photo: await fileToDataUrl(file) })
      setGen(0)
    } catch {
      toast('Couldn’t read that image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="av__stage">
      <div
        className="av__frame"
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
        {profile.photo ? (
          <img
            src={profile.photo}
            alt="Your full-body reference"
            style={{
              transform: `scale(${profile.photoScale})`,
              objectPosition: `50% ${profile.photoY}%`,
            }}
          />
        ) : (
          <Figure />
        )}

        {/* Measurement pins read straight off the sliders. */}
        <Pin top="27%" width={pinWidth(profile.chest, 30, 56)} label={`Chest ${profile.chest}″`} />
        <Pin top="42%" width={pinWidth(profile.waist, 26, 48)} label={`Waist ${profile.waist}″`} />
        <Pin
          top="72%"
          width={pinWidth(profile.inseam, 26, 38, 0.5)}
          label={`Inseam ${profile.inseam}″`}
        />

        {gen !== null && (
          <div className="gen" role="status">
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

function Pin({ top, width, label }: { top: string; width: string; label: string }) {
  return (
    <div className="pin" style={{ top }}>
      <div className="pin__rule" style={{ width }}>
        <span className="pin__tag">{label}</span>
      </div>
    </div>
  )
}

/** Placeholder mannequin so the frame reads as a fitting room, not a broken image. */
function Figure() {
  return (
    <svg
      viewBox="0 0 120 200"
      style={{ width: '58%', height: '86%', opacity: 0.16 }}
      aria-hidden="true"
      fill="none"
      stroke="#1c2a20"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* head + neck */}
      <ellipse cx="60" cy="20" rx="11" ry="13" />
      <path d="M56 32c0 4-1 6-4 8m12-8c0 4 1 6 4 8" />
      {/* torso */}
      <path d="M52 40h16c10 0 17 6 19 15l3 14c1 5-1 8-5 9l-6 1-1-7v34c0 5-8 8-18 8s-18-3-18-8V72l-1 7-6-1c-4-1-6-4-5-9l3-14c2-9 9-15 19-15Z" />
      {/* arms */}
      <path d="M31 62l-4 26c-1 5 0 8 2 12l4 8m56-46 4 26c1 5 0 8-2 12l-4 8" />
      {/* hips + legs */}
      <path d="M42 112v14c0 4 1 8 2 12l6 44c0 3 3 5 7 5h6c4 0 7-2 7-5l6-44c1-4 2-8 2-12v-14" />
      <path d="M60 118v66" opacity=".5" />
      {/* ground shadow */}
      <ellipse cx="60" cy="192" rx="26" ry="4" opacity=".4" />
    </svg>
  )
}
