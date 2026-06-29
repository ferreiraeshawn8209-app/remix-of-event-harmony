export function buildMixcloudEmbedSrc(feed: string) {
  const encoded = encodeURIComponent(feed);
  return `https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&autoplay=1&feed=${encoded}`;
}
