import { PortalLayout } from '../../components/PortalLayout';
import { TrackComplaintContent } from '../public/TrackComplaintPage';

export function CitizenTrackPage() {
  return (
    <PortalLayout
      portal="citizen"
      title="Track Complaint"
      breadcrumb="Citizen Portal / Track Complaint"
    >
      <TrackComplaintContent />
    </PortalLayout>
  );
}
