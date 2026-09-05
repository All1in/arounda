import { describe, expect, it, vi } from 'vitest';
import { generateMetadata } from './page';

vi.mock('next/navigation', () => ({ notFound: vi.fn() }));

// Next 16 hands generateMetadata a decoded `params`, so anything the page still has to
// decode is already decoded here. Decoding a second time rewrote the tag.
function metadataProps(tag: string) {
  return { params: Promise.resolve({ tag }), searchParams: Promise.resolve({}) };
}

describe('/tags/[tag] generateMetadata', () => {
  it('does not decode a param Next has already decoded', async () => {
    // regression: this used to title the page "a+b photos" while the <h1> said "a%2Bb"
    await expect(generateMetadata(metadataProps('a%2Bb'))).resolves.toMatchObject({
      title: 'a%2Bb photos',
      description: 'Free high-resolution photos tagged “a%2Bb”.',
    });
  });

  it('leaves a tag that survived one decode alone', async () => {
    // regression: "x%20y" used to become "x y"
    await expect(generateMetadata(metadataProps('x%20y'))).resolves.toMatchObject({
      title: 'x%20y photos',
    });
  });

  it('titles an ordinary decoded tag unchanged', async () => {
    await expect(generateMetadata(metadataProps('business travel'))).resolves.toMatchObject({
      title: 'business travel photos',
    });
  });

  it('normalises the decoded tag the same way the page does', async () => {
    await expect(generateMetadata(metadataProps('  blue   sky  '))).resolves.toMatchObject({
      title: 'blue sky photos',
    });
  });
});
