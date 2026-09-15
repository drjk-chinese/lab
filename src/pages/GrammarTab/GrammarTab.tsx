import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getGrammar, getSentences } from '../../lib/dataSource'
import { speak } from '../../lib/tts'
import type { GrammarData, GrammarExample, SentencesData, GrammarRole } from '../../types'

const LESSON_ID = 'L01'

const ROLE_CLASS: Record<GrammarRole, string> = {
  verb: 'text-role-verb',
  complement: 'text-role-complement',
  marker: 'text-role-marker',
  object: 'text-role-object',
  subject: 'text-role-subject',
  rang: 'text-role-rang',
  object_person: 'text-role-object-person',
  action: 'text-role-action',
}

export function GrammarTab() {
  const [grammar, setGrammar] = useState<GrammarData | null>(null)
  const [sentences, setSentences] = useState<SentencesData | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    getGrammar(LESSON_ID).then(setGrammar)
    getSentences(LESSON_ID).then(setSentences)
  }, [])

  useEffect(() => {
    const target = searchParams.get('card')
    if (!target || !grammar) return
    document.getElementById(`grammar-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [searchParams, grammar])

  if (!grammar || !sentences) return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>

  const allSentences = sentences.sections.flatMap((s) => s.sentences)

  // Grammar card examples quote a short excerpt of the body text, but the
  // actual reading-tab sentence can be a longer sentence the excerpt is
  // embedded in (e.g. G1 and G5 both quote clauses from one combined
  // sentence). Match by substring rather than exact equality, ignoring the
  // example's trailing punctuation.
  function findSentenceId(exampleHanzi: string): string | undefined {
    const needle = exampleHanzi.replace(/[。！？]+$/, '')
    return allSentences.find((s) => s.hanzi.includes(needle))?.sentence_id
  }

  return (
    <div className="px-4 py-4 pb-24">
      {grammar.grammar_cards.map((card) => (
        <section
          key={card.card_id}
          id={`grammar-${card.card_id}`}
          className="mb-6 border border-line bg-card px-4 py-4"
        >
          <p className="text-xs font-medium text-teal">{card.card_id}</p>
          <h2 className="mt-0.5 text-lg font-semibold">{card.title}</h2>
          <p className="mt-2 text-sm">
            <span className="text-text-muted">구조 </span>
            {card.structure}
          </p>
          <p className="mt-1 text-sm">
            <span className="text-text-muted">의미 </span>
            {card.meaning}
          </p>
          {card.footnote && <p className="mt-2 text-xs text-text-muted">※ {card.footnote}</p>}

          <div className="mt-3 space-y-3">
            {card.examples.map((ex, idx) => (
              <ExampleRow key={idx} example={ex} sentenceId={findSentenceId(ex.hanzi)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ExampleRow({ example, sentenceId }: { example: GrammarExample; sentenceId?: string }) {
  return (
    <div className="divider-line pb-3">
      <p className="font-hanzi text-lg leading-relaxed">
        {example.segments
          ? example.segments.map((seg, i) => (
              <span key={i} className={ROLE_CLASS[seg.role]}>
                {seg.text}
              </span>
            ))
          : example.hanzi}
      </p>
      <p className="mt-1 text-sm text-teal">{example.pinyin}</p>
      <p className="mt-1 text-sm text-text-muted">{example.meaning_kr}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <button
          onClick={() => speak(example.hanzi)}
          className="border border-teal px-2 py-1 text-teal"
        >
          🔊 듣기
        </button>
        {example.source === 'text' && (
          <span className="border border-line px-1.5 py-0.5 text-text-muted">본문</span>
        )}
        {sentenceId && (
          <Link to={`/reading?sentence=${sentenceId}`} className="text-teal underline">
            낭독 탭에서 듣기 →
          </Link>
        )}
      </div>
    </div>
  )
}
