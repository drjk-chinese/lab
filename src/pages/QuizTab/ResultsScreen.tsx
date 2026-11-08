interface Props {
  studentId: string | null
  studentName: string | null
  lessonTitle: string
  correctCount: number
  totalCount: number
  wrongCount: number
  canRetryWrong: boolean
  onRetryWrong: () => void
  onRetryFresh: () => void
}

export function ResultsScreen({
  studentId,
  studentName,
  lessonTitle,
  correctCount,
  totalCount,
  wrongCount,
  canRetryWrong,
  onRetryWrong,
  onRetryFresh,
}: Props) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const percent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-sm border border-line bg-card px-6 py-8 text-center">
        <p className="text-xs text-text-muted">{lessonTitle} 퀴즈 결과</p>
        <p className="mt-1 text-sm font-medium">
          {studentId} {studentName ? `${studentName}님` : ''}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{today}</p>

        <p className="mt-6 text-4xl font-bold text-accent">
          {correctCount} <span className="text-xl text-text-muted">/ {totalCount}</span>
        </p>
        <p className="mt-1 text-sm text-text-muted">정답률 {percent}%</p>

        {wrongCount > 0 && (
          <p className="mt-4 text-xs text-text-muted">틀린 문제 {wrongCount}개</p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        이 화면을 캡쳐해서 LMS에 제출하세요.
      </p>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
        {canRetryWrong && (
          <button onClick={onRetryWrong} className="w-full border border-accent py-3 text-sm text-accent">
            오답만 다시 풀기 (변형문제)
          </button>
        )}
        <button onClick={onRetryFresh} className="w-full bg-accent py-3 text-sm font-medium text-white">
          새 문제로 처음부터 다시 풀기
        </button>
      </div>
    </div>
  )
}
