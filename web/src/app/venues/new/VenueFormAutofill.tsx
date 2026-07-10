'use client';

import PlaceAutocomplete, { type PlaceDetail } from '@/components/ui/PlaceAutocomplete';

export default function VenueFormAutofill() {
  const handleSelect = (detail: PlaceDetail) => {
    const fill = (name: string, value: string) => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (el && value) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    fill('name', detail.name);
    fill('address', detail.address);
    if (detail.phone) fill('phone', detail.phone);
  };

  return <PlaceAutocomplete onSelect={handleSelect} />;
}
