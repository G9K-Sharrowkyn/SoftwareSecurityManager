import { Dialog, DialogContent } from "@/components/ui/dialog";
import BoosterPack from "@/components/cards/BoosterPack";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availablePacks?: any[];
}

export default function BoosterPackModal({ isOpen, onClose, availablePacks = [] }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <h2 className="text-lg mb-4">Your Booster Packs</h2>
        {availablePacks.length === 0 ? (
          <p>No packs available.</p>
        ) : (
          <div className="space-y-2">
            {availablePacks.map((pack) => (
              <BoosterPack key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
