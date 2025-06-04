interface BoosterPackProps {
  pack: any;
}

export default function BoosterPack({ pack }: BoosterPackProps) {
  return (
    <div className="flex items-center justify-between bg-cosmic-700/40 p-2 rounded">
      <div className="text-cosmic-silver">Pack #{pack.id}</div>
      <button className="text-cosmic-gold text-sm" onClick={() => fetch(`/api/booster-packs/${pack.id}/open`, { method: 'POST', credentials: 'include' }).then(() => window.location.reload())}>
        Open
      </button>
    </div>
  );
}
