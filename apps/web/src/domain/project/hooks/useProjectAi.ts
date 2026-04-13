import { useMutation } from '@tanstack/react-query';
import { projectApiService } from '../service/project.service';

export const useGenerateAiDraft = () => {
  return useMutation({
    mutationFn: (data: { title: string; brief_description: string; category?: string; language?: string }) =>
      projectApiService.generateAiDraft(data),
  });
};
