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

import { readFile, writeFile } from 'node:fs/promises'

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
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`ElevenLabs API error ${res.status}: ${await res.text()}`)
  }
  return Buffer.from(await res.arrayBuffer())
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

async function main() {
  const data = JSON.parse(await readFile(DATA_PATH, 'utf-8'))
  const allSentences = data.sections.flatMap((s) => s.sentences)
  const targets = LIMIT === 'all' ? allSentences : allSentences.slice(0, Number(LIMIT))

  console.log(`Generating audio for ${targets.length} of ${allSentences.length} sentences (LIMIT=${LIMIT})`)

  for (const sentence of targets) {
    try {
      console.log(`- ${sentence.sentence_id}: ${sentence.hanzi}`)
      const audioBuffer = await synthesize(sentence.hanzi)
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
