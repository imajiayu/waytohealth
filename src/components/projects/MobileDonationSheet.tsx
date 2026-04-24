'use client';

import { useTranslations } from 'next-intl';
import BottomSheet from '@/components/common/BottomSheet';
import DonationSidebar from '@/components/projects/DonationSidebar';

interface MobileDonationSheetProps {
  goalAmount: number | null;
  raisedAmount: number;
  projectTitle: string;
  monobankJarSendId?: string;
}

export default function MobileDonationSheet({
  goalAmount,
  raisedAmount,
  projectTitle,
  monobankJarSendId,
}: MobileDonationSheetProps) {
  const t = useTranslations('projectDetail');

  return (
    <BottomSheet
      isOpen
      minimizedHint={t('donateButton')}
    >
      <div className="px-4 pt-1 pb-4">
        <DonationSidebar
          goalAmount={goalAmount}
          raisedAmount={raisedAmount}
          projectTitle={projectTitle}
          monobankJarSendId={monobankJarSendId}
        />
      </div>
    </BottomSheet>
  );
}
