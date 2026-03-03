"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { IssueForm } from "@/components/issues/issue-form";
import { ProjectForm } from "@/components/projects/project-form";
import { useCreateIssueMutation } from "@/hooks/use-issues";
import { useCreateProjectMutation } from "@/hooks/use-projects";
import { useUIStore } from "@/hooks/use-ui-store";

export function GlobalModals() {
  const { 
    isNewIssueModalOpen, setNewIssueModalOpen, closeNewIssueModal,
    isNewProjectModalOpen, setNewProjectModalOpen, closeNewProjectModal
  } = useUIStore();
  
  const createIssueMutation = useCreateIssueMutation();
  const createProjectMutation = useCreateProjectMutation();

  const handleCreateIssue = async (data: any) => {
    await createIssueMutation.mutateAsync(data);
    closeNewIssueModal();
  };

  const handleCreateProject = async (data: any) => {
    await createProjectMutation.mutateAsync(data);
    closeNewProjectModal();
  };

  return (
    <>
      {/* New Issue Modal */}
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

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setNewProjectModalOpen}>
        <DialogContent>
          <DialogHeader onClose={closeNewProjectModal}>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ProjectForm 
              onSubmit={handleCreateProject}
              onCancel={closeNewProjectModal}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
