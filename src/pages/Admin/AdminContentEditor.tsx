import { useEffect, useState } from 'react'
import { getVocab, getGrammar, saveContent } from '../../lib/dataSource'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { EditableField } from './EditableField'
import type { VocabData, GrammarData, GrammarCard, GrammarExample } from '../../types'

const LESSON_ID = 'L01'

function nextCardId(cards: GrammarCard[]): string {
  const numbers = cards
    .map((c) => /^G(\d+)$/.exec(c.card_id)?.[1])
    .filter((n): n is string => !!n)
    .map(Number)
  const max = numbers.length > 0 ? Math.max(...numbers) : 0
  return `G${max + 1}`
}

export function AdminContentEditor() {
  const [vocab, setVocab] = useState<VocabData | null>(null)
  const [grammar, setGrammar] = useState<GrammarData | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [newCardOpen, setNewCardOpen] = useState(false)
  const [newCard, setNewCard] = useState({
    title: '',
    structure: '',
    meaning: '',
    hanzi: '',
    pinyin: '',
    meaning_kr: '',
  })

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

  function updateExampleField(
    cardIdx: number,
    exIdx: number,
    field: 'hanzi' | 'pinyin' | 'meaning_kr',
    next: string,
  ) {
    if (!grammar) return
    const updated: GrammarData = structuredClone(grammar)
    updated.grammar_cards[cardIdx].examples[exIdx][field] = next
    setGrammar(updated)
    void persist('grammar', updated)
  }

  function addExample(cardIdx: number) {
    if (!grammar) return
    const updated: GrammarData = structuredClone(grammar)
    const newExample: GrammarExample = {
      source: 'extra',
      hanzi: '새 예문을 입력하세요',
      pinyin: 'pinyin',
      meaning_kr: '뜻',
    }
    updated.grammar_cards[cardIdx].examples.push(newExample)
    setGrammar(updated)
    void persist('grammar', updated)
  }

  function deleteExample(cardIdx: number, exIdx: number) {
    if (!grammar) return
    if (!confirm('이 예문을 삭제할까요?')) return
    const updated: GrammarData = structuredClone(grammar)
    updated.grammar_cards[cardIdx].examples.splice(exIdx, 1)
    setGrammar(updated)
    void persist('grammar', updated)
  }

  function deleteCard(cardIdx: number) {
    if (!grammar) return
    if (!confirm('이 문법 카드 전체를 삭제할까요? 되돌릴 수 없습니다.')) return
    const updated: GrammarData = structuredClone(grammar)
    updated.grammar_cards.splice(cardIdx, 1)
    setGrammar(updated)
    void persist('grammar', updated)
  }

  function submitNewCard() {
    if (!grammar) return
    if (!newCard.title.trim()) {
      alert('카드 제목을 입력해 주세요.')
      return
    }
    const updated: GrammarData = structuredClone(grammar)
    const card: GrammarCard = {
      card_id: nextCardId(updated.grammar_cards),
      title: newCard.title.trim(),
      structure: newCard.structure.trim(),
      meaning: newCard.meaning.trim(),
      examples: newCard.hanzi.trim()
        ? [
            {
              source: 'extra',
              hanzi: newCard.hanzi.trim(),
              pinyin: newCard.pinyin.trim(),
              meaning_kr: newCard.meaning_kr.trim(),
            },
          ]
        : [],
    }
    updated.grammar_cards.push(card)
    setGrammar(updated)
    void persist('grammar', updated)
    setNewCard({ title: '', structure: '', meaning: '', hanzi: '', pinyin: '', meaning_kr: '' })
    setNewCardOpen(false)
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
            <div className="flex items-start justify-between">
              <p className="text-xs text-text-muted">{card.card_id}</p>
              <button
                onClick={() => deleteCard(cIdx)}
                className="text-xs text-accent underline"
              >
                카드 삭제
              </button>
            </div>
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

            <div className="mt-2 space-y-2 border-t border-line pt-2">
              {card.examples.map((ex, exIdx) => (
                <div key={exIdx} className="flex flex-wrap items-center gap-2 text-xs">
                  <EditableField
                    className="font-hanzi text-sm"
                    value={ex.hanzi}
                    onSave={(v) => updateExampleField(cIdx, exIdx, 'hanzi', v)}
                  />
                  <EditableField
                    className="text-teal"
                    value={ex.pinyin}
                    onSave={(v) => updateExampleField(cIdx, exIdx, 'pinyin', v)}
                  />
                  <EditableField
                    value={ex.meaning_kr}
                    onSave={(v) => updateExampleField(cIdx, exIdx, 'meaning_kr', v)}
                  />
                  <button
                    onClick={() => deleteExample(cIdx, exIdx)}
                    className="text-accent underline"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() => addExample(cIdx)}
                className="border border-teal px-2 py-1 text-xs text-teal"
              >
                + 예문 추가
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        {!newCardOpen ? (
          <button
            onClick={() => setNewCardOpen(true)}
            className="w-full border border-accent py-2 text-sm text-accent"
          >
            + 새 문법 카드 추가
          </button>
        ) : (
          <div className="space-y-2 border border-accent bg-accent-soft px-3 py-3 text-sm">
            <p className="text-xs font-medium text-accent">
              새 카드 ({nextCardId(grammar.grammar_cards)})
            </p>
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm"
              placeholder="카드 제목 (예: 비교문 比)"
              value={newCard.title}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
            />
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm"
              placeholder="구조 (예: A + 比 + B + 형용사)"
              value={newCard.structure}
              onChange={(e) => setNewCard({ ...newCard, structure: e.target.value })}
            />
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm"
              placeholder="의미 설명"
              value={newCard.meaning}
              onChange={(e) => setNewCard({ ...newCard, meaning: e.target.value })}
            />
            <p className="pt-1 text-xs text-text-muted">첫 예문 (선택, 나중에 카드 안에서 추가 가능)</p>
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm font-hanzi"
              placeholder="한자 예문"
              value={newCard.hanzi}
              onChange={(e) => setNewCard({ ...newCard, hanzi: e.target.value })}
            />
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm"
              placeholder="병음"
              value={newCard.pinyin}
              onChange={(e) => setNewCard({ ...newCard, pinyin: e.target.value })}
            />
            <input
              className="w-full border border-line bg-bg-app px-2 py-1.5 text-sm"
              placeholder="뜻(한국어)"
              value={newCard.meaning_kr}
              onChange={(e) => setNewCard({ ...newCard, meaning_kr: e.target.value })}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={submitNewCard} className="flex-1 bg-accent py-2 text-white">
                카드 추가
              </button>
              <button
                onClick={() => setNewCardOpen(false)}
                className="flex-1 border border-line py-2"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
