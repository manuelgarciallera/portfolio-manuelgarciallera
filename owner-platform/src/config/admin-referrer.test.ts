import { expect, it } from 'vitest'
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server'
import nextConfig from '../../next.config.mjs'

it.each(['/admin', '/admin/login', '/admin/reset/synthetic-token?next=private', '/admin/content-preview/pages/1'])('withholds private document URLs as referrers: %s', async pathname => {
  const response = await unstable_getResponseFromNextConfig({ url: `https://owner.example.invalid${pathname}`, nextConfig })
  expect(response.headers.get('referrer-policy')).toBe('no-referrer')
})

it('does not apply the admin document policy to unrelated paths', async () => {
  const response = await unstable_getResponseFromNextConfig({ url: 'https://owner.example.invalid/administrator', nextConfig })
  expect(response.headers.get('referrer-policy')).toBeNull()
})
