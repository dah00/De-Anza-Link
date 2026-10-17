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
  const apple = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name)}`;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <iframe
        title={`Map of ${name}`}
        src={src}
        className="h-48 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="min-w-0 truncate font-medium">{name}</span>
        <p className="flex shrink-0 gap-3">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Google Maps
          </a>
          <a
            href={apple}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Apple Maps
          </a>
        </p>
      </div>
    </div>
  );
}
