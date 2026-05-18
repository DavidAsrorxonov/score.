import { PageContainer } from "@/components/app/page-container";
import { LoadingState } from "@/components/shared/loading-state";

export default function AppLoading() {
  return (
    <PageContainer>
      <LoadingState variant="page" />
    </PageContainer>
  );
}
