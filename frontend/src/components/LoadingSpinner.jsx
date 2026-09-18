import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <Loader2
      className={`animate-spin text-primary-600 ${sizes[size] || sizes.md} ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
