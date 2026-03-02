"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { IssueForm } from "@/components/issues/issue-form";
import { useCreateIssueMutation } from "@/hooks/use-issues";
import { useUIStore } from "@/hooks/use-ui-store";

export function GlobalModals() {
  const { isNewIssueModalOpen, setNewIssueModalOpen, closeNewIssueModal } = useUIStore();
  const createIssueMutation = useCreateIssueMutation();

  const handleCreateIssue = async (data: any) => {
    await createIssueMutation.mutateAsync(data);
    closeNewIssueModal();
  };

  return (
    <>
      <Dialog open={isNewIssueModalOpen} onOpenChange={setNewIssueModalOpen}>
        <DialogContent>
          <DialogHeader onClose={closeNewIssueModal}>
            <DialogTitle>Create New Issue</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <IssueForm 
              onSubmit={handleCreateIssue}
              onCancel={closeNewIssueModal}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
