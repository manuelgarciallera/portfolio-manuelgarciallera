import dynamic from 'next/dynamic'

const PreviewRuntime = dynamic(() => import('@/components/PreviewRuntime').then((m) => m.PreviewRuntime), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  return <PreviewRuntime />
}
