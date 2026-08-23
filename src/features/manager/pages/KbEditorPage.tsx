import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  GuideEditorForm,
  GuideEditorFormSkeleton,
} from "@/shared/components/kb/GuideEditorForm";
import {
  useManagerKbDetail,
  useManagerCreateKbArticle,
  useManagerUpdateKbArticle,
} from "@/features/manager/hooks/kb/useManagerKb";
import type { KbArticleFormValues } from "@/shared/schemas/kb/kb-article.schema";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  // Writing an article from a ticket → the image picker adds an extra "Photos from chat" tab
  const ticketId = location.state?.ticketId as string | undefined;
  // Suggested category when created from a ticket (the ticket's category).
  const initialCategory = location.state?.category as
    | TicketCategoryEnum
    | undefined;

  const { data: existing, isLoading } = useManagerKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } =
    useManagerCreateKbArticle();
  const { mutateAsync: update, isPending: updating } =
    useManagerUpdateKbArticle();

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      // KB is always internal (Customers view articles via Blog, not KB) → isInternalOnly=true.
      const payload = { ...values, isInternalOnly: true };
      if (isEdit) {
        await update({ id, payload });
        navigate(`/manager/kb/${id}`);
      } else {
        const res = await create(payload);
        navigate(res?.id ? `/manager/kb/${res.id}` : "/manager/kb");
      }
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (isEdit && isLoading) return <GuideEditorFormSkeleton />;

  return (
    <GuideEditorForm
      basePath="/manager/kb"
      articleId={id}
      existing={existing}
      isSaving={creating || updating}
      onSubmit={onSubmit}
      ticketId={ticketId}
      initialCategory={initialCategory}
    />
  );
}
