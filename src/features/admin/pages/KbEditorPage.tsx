import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  GuideEditorForm,
  GuideEditorFormSkeleton,
} from "@/shared/components/kb/GuideEditorForm";
import {
  useAdminKbDetail,
  useCreateKbArticle,
  useUpdateKbArticle,
} from "@/features/admin/hooks/kb/useAdminKb";
import type { KbArticleFormValues } from "@/shared/schemas/kb/kb-article.schema";
import type { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  // Writing an article from a ticket → the image picker gains that ticket's "Chat images" tab
  const ticketId = location.state?.ticketId as string | undefined;
  const initialCategory = location.state?.category as
    | TicketCategoryEnum
    | undefined;

  const { data: existing, isLoading } = useAdminKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useCreateKbArticle();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      // KB is always internal (Customers read the Blog, not the KB) → isInternalOnly=true.
      const payload = { ...values, isInternalOnly: true };
      if (isEdit) {
        await update({ id, payload });
        navigate(`/admin/kb/${id}`);
      } else {
        const res = await create(payload);
        navigate(res?.id ? `/admin/kb/${res.id}` : "/admin/kb");
      }
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (isEdit && isLoading) return <GuideEditorFormSkeleton />;

  return (
    <GuideEditorForm
      basePath="/admin/kb"
      articleId={id}
      existing={existing}
      isSaving={creating || updating}
      onSubmit={onSubmit}
      ticketId={ticketId}
      initialCategory={initialCategory}
    />
  );
}
