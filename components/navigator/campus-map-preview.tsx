type CampusMapPreviewProps = {
  name: string;
  lat: number;
  lng: number;
  mapUrl: string;
};

export function CampusMapPreview({
  name,
  lat,
  lng,
  mapUrl,
}: CampusMapPreviewProps) {
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=18&output=embed`;

  return (
    <div className="overflow-hidden rounded-lg border">
      <iframe
        title={`Map of ${name}`}
        src={src}
        className="h-56 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
        <span className="font-medium">{name}</span>
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}