import dynamic from 'next/dynamic'

const PortfolioPreview = dynamic(() => import('@/components/PortfolioPreview'), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  return <PortfolioPreview />
}
