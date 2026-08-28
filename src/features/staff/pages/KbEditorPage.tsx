import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  GuideEditorForm,
  GuideEditorFormSkeleton,
} from "@/shared/components/kb/GuideEditorForm";
import {
  useStaffKbDetail,
  useStaffKbCreate,
  useStaffKbUpdate,
} from "@/features/staff/hooks/kb/useStaffKb";
import type { KbArticleFormValues } from "@/shared/schemas/kb/kb-article.schema";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  // Writing from a ticket → the image picker gets an extra "Photos from chat" tab
  const ticketId = location.state?.ticketId as string | undefined;
  // Suggested category when creating from a ticket (the ticket's category).
  const initialCategory = location.state?.category as
    | TicketCategoryEnum
    | undefined;

  const { data: existing, isLoading } = useStaffKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useStaffKbCreate();
  const { mutateAsync: update, isPending: updating } = useStaffKbUpdate();

  // No try-catch: the rejection has to reach GuideEditorForm, which owns setError and
  // routes EntityError to the field the BE rejected.
  const onSubmit = async (values: KbArticleFormValues) => {
    // KB is always internal (Customers view via Blog, not KB) → isInternalOnly=true.
    const payload = { ...values, isInternalOnly: true };
    if (isEdit) {
      await update({ id, payload });
      navigate(`/staff/kb/${id}`);
    } else {
      const res = await create(payload);
      navigate(res?.id ? `/staff/kb/${res.id}` : "/staff/kb");
    }
  };

  if (isEdit && isLoading) return <GuideEditorFormSkeleton />;

  return (
    <GuideEditorForm
      basePath="/staff/kb"
      articleId={id}
      existing={existing}
      isSaving={creating || updating}
      onSubmit={onSubmit}
      ticketId={ticketId}
      initialCategory={initialCategory}
    />
  );
}
