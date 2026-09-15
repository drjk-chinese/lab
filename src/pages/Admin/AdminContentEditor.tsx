import { useEffect, useState } from 'react'
import { getVocab, getGrammar, saveContent } from '../../lib/dataSource'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { EditableField } from './EditableField'
import type { VocabData, GrammarData } from '../../types'

const LESSON_ID = 'L01'

export function AdminContentEditor() {
  const [vocab, setVocab] = useState<VocabData | null>(null)
  const [grammar, setGrammar] = useState<GrammarData | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    getVocab(LESSON_ID).then(setVocab)
    getGrammar(LESSON_ID).then(setGrammar)
  }, [])

  async function persist(kind: 'vocab' | 'grammar', payload: VocabData | GrammarData) {
    const ok = await saveContent(LESSON_ID, kind, payload)
    setStatus(
      ok
        ? '저장되었습니다. (Supabase에 즉시 반영)'
        : 'Supabase가 연결되어 있지 않아 이 화면에서만 미리보기로 저장됩니다. 새로고침하면 초기화됩니다.',
    )
    setTimeout(() => setStatus(null), 4000)
  }

  function updateWordField(
    sectionIdx: number,
    wordIdx: number,
    field: 'hanzi' | 'pinyin' | 'meaning_kr',
    next: string,
  ) {
    if (!vocab) return
    const updated: VocabData = structuredClone(vocab)
    updated.sections[sectionIdx].words[wordIdx][field] = next
    setVocab(updated)
    void persist('vocab', updated)
  }

  function updateCardField(cardIdx: number, field: 'title' | 'structure' | 'meaning', next: string) {
    if (!grammar) return
    const updated: GrammarData = structuredClone(grammar)
    updated.grammar_cards[cardIdx][field] = next
    setGrammar(updated)
    void persist('grammar', updated)
  }

  if (!vocab || !grammar) return <div className="p-6 text-sm text-text-muted">불러오는 중…</div>

  return (
    <div className="px-4 py-4">
      {!isSupabaseConfigured && (
        <p className="mb-4 border border-dashed border-line bg-card px-3 py-2 text-xs text-text-muted">
          Supabase 연동 전이라 편집 내용이 서버에 저장되지 않습니다. 환경변수(VITE_SUPABASE_URL /
          VITE_SUPABASE_ANON_KEY)를 설정하면 실시간 저장됩니다.
        </p>
      )}
      {status && <p className="mb-4 text-xs text-teal">{status}</p>}

      <h2 className="mb-2 text-sm font-semibold text-text-muted">단어 카드 편집</h2>
      {vocab.sections.map((section, sIdx) => (
        <div key={section.section_id} className="mb-4">
          <p className="mb-1 text-xs text-text-muted">{section.section_id}</p>
          <ul>
            {section.words.map((w, wIdx) => (
              <li key={w.word_id} className="divider-line flex flex-wrap items-center gap-2 py-2 text-sm">
                <EditableField
                  className="font-hanzi text-base"
                  value={w.hanzi}
                  onSave={(v) => updateWordField(sIdx, wIdx, 'hanzi', v)}
                />
                <EditableField
                  className="text-teal"
                  value={w.pinyin}
                  onSave={(v) => updateWordField(sIdx, wIdx, 'pinyin', v)}
                />
                <EditableField
                  value={w.meaning_kr}
                  onSave={(v) => updateWordField(sIdx, wIdx, 'meaning_kr', v)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="mb-2 mt-6 text-sm font-semibold text-text-muted">문법 카드 편집</h2>
      <ul>
        {grammar.grammar_cards.map((card, cIdx) => (
          <li key={card.card_id} className="divider-line py-3 text-sm">
            <p className="text-xs text-text-muted">{card.card_id}</p>
            <p className="mt-1">
              <EditableField
                className="font-medium"
                value={card.title}
                onSave={(v) => updateCardField(cIdx, 'title', v)}
              />
            </p>
            <p className="mt-1">
              구조:{' '}
              <EditableField
                value={card.structure}
                onSave={(v) => updateCardField(cIdx, 'structure', v)}
              />
            </p>
            <p className="mt-1">
              의미:{' '}
              <EditableField
                value={card.meaning}
                onSave={(v) => updateCardField(cIdx, 'meaning', v)}
              />
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
