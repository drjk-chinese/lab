// Generates one ElevenLabs mp3 per reading-tab sentence, uploads each to
// Supabase Storage, and writes the resulting public URLs back into
// src/data/sentences_L01.json (audio_url field). Run via the
// "Generate lesson audio" GitHub Actions workflow (workflow_dispatch) —
// see README for the required repo secrets.
//
// Env vars required:
//   ELEVENLABS_API_KEY
//   ELEVENLABS_VOICE_ID
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_AUDIO_BUCKET (defaults to "audio")
//   LIMIT ("2" for a quick test, "all" for every sentence — defaults to "2")

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const DATA_PATH = new URL('../src/data/sentences_L01.json', import.meta.url)

const {
  ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_AUDIO_BUCKET = 'audio',
  LIMIT = '2',
} = process.env

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
}

requireEnv('ELEVENLABS_API_KEY', ELEVENLABS_API_KEY)
requireEnv('ELEVENLABS_VOICE_ID', ELEVENLABS_VOICE_ID)
requireEnv('SUPABASE_URL', SUPABASE_URL)
requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY)

async function synthesize(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        // Forces Chinese pronunciation instead of relying on the model's
        // auto language-detection, which was mispronouncing 汉语 in short
        // sentences (the ElevenLabs website playground gets this right
        // because it lets you pick the language explicitly).
        language_code: 'zh',
        // No stability/similarity override: use the voice's own saved
        // default settings, same as the website preview.
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`ElevenLabs API error ${res.status}: ${await res.text()}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

/** Normalizes loudness with ffmpeg (preinstalled on GitHub-hosted runners) so quiet lines aren't hard to hear. */
async function normalizeLoudness(buffer) {
  const dir = await mkdtemp(join(tmpdir(), 'audio-'))
  const inPath = join(dir, 'in.mp3')
  const outPath = join(dir, 'out.mp3')
  try {
    await writeFile(inPath, buffer)
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inPath,
      '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
      outPath,
    ])
    return await readFile(outPath)
  } catch (err) {
    console.error(`  loudness normalization skipped (ffmpeg error): ${err.message}`)
    return buffer
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function uploadToSupabase(path, buffer) {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_AUDIO_BUCKET}/${path}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'true',
    },
    body: buffer,
  })
  if (!res.ok) {
    throw new Error(`Supabase upload error ${res.status}: ${await res.text()}`)
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_AUDIO_BUCKET}/${path}`
}

function resolveTargets(allSentences, limit) {
  if (limit === 'all') return allSentences
  if (/^\d+$/.test(limit)) return allSentences.slice(0, Number(limit))
  // Comma-separated sentence_id list, e.g. "L01S1_SENT02" or
  // "L01S1_SENT02,L01S2_SENT01" — lets you cheaply re-generate just the
  // sentence(s) that came out wrong instead of redoing all 22.
  const ids = limit.split(',').map((s) => s.trim())
  return allSentences.filter((s) => ids.includes(s.sentence_id))
}

async function main() {
  const data = JSON.parse(await readFile(DATA_PATH, 'utf-8'))
  const allSentences = data.sections.flatMap((s) => s.sentences)
  const targets = resolveTargets(allSentences, LIMIT)

  console.log(`Generating audio for ${targets.length} of ${allSentences.length} sentences (LIMIT=${LIMIT})`)

  for (const sentence of targets) {
    try {
      const ttsText = sentence.tts_text ?? sentence.hanzi
      console.log(`- ${sentence.sentence_id}: ${ttsText}`)
      const rawAudio = await synthesize(ttsText)
      const audioBuffer = await normalizeLoudness(rawAudio)
      const path = `L01/${sentence.sentence_id}.mp3`
      const publicUrl = await uploadToSupabase(path, audioBuffer)
      sentence.audio_url = publicUrl
      console.log(`  -> ${publicUrl}`)
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
    }
  }

  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log('Updated src/data/sentences_L01.json')
}

main()
