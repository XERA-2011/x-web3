'use client';

import dynamic from 'next/dynamic';

const LanternContainer = dynamic(
    () => import('@/components/viz/lantern/LanternContainer'),
    { ssr: false }
);

export default function LanternPage() {
    return <LanternContainer />;
}
