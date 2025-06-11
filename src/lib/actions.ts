'use server';
import { suggestOkrsImprovements, type SuggestOkrsImprovementsInput, type SuggestOkrsImprovementsOutput } from '@/ai/flows/suggest-okr-improvements';
import type { Objective } from '@/types/okr';

export async function getOkrImprovementSuggestionsAction(objectiveData: Objective): Promise<SuggestOkrsImprovementsOutput> {
  if (!objectiveData) {
    console.error("Objective data is undefined in server action");
    return { suggestions: ["Error: Missing objective data to process suggestions."] };
  }
  const input: SuggestOkrsImprovementsInput = {
    objectiveDescription: objectiveData.description,
    keyResults: objectiveData.keyResults.map(kr => ({
      keyResultDescription: kr.description,
      progress: kr.progress,
      confidenceLevel: kr.confidenceLevel,
      initiatives: kr.initiatives.map(i => ({
        initiativeDescription: i.description,
        status: i.status,
      })),
    })),
  };
  try {
    const result = await suggestOkrsImprovements(input);
    return result;
  } catch (error) {
    console.error("Error getting OKR improvement suggestions:", error);
    return { suggestions: ["An error occurred while fetching suggestions. Please try again later."] };
  }
}
