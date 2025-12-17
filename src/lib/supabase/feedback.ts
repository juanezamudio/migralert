import { createClient } from "./client";

export type FeedbackCategory = "bug" | "feature" | "improvement" | "other";

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  title: string;
  description?: string;
  email?: string;
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const supabase = createClient();

  // Get current user if authenticated
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    category: input.category,
    title: input.title,
    description: input.description || null,
    user_id: user?.id || null,
    user_email: input.email || user?.email || null,
  });

  if (error) {
    console.error("Error submitting feedback:", error);
    throw new Error(error.message);
  }
}

// Future: Get all feedback for public board
export async function getFeedback() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching feedback:", error);
    throw new Error(error.message);
  }

  return data;
}
