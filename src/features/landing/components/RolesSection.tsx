import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ROLES } from "@/features/landing/landing.constants";
import type { RoleItem } from "@/features/landing/types/landing.types";

const slideVariants = (index: number): Variants => ({
  hidden: { opacity: 0, x: index === 0 ? -40 : 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: index * 0.1, duration: 0.5, ease: "easeOut" },
  },
});

const RoleCard = ({ role, index }: { role: RoleItem; index: number }) => (
  <motion.div
    variants={slideVariants(index)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    whileHover="hover"
    className="group h-full cursor-default rounded-md border border-white/10 bg-white/[0.04] p-6"
  >
    <div className="mb-8 flex items-center justify-between">
      <motion.div
        className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-950"
        variants={{ hover: { scale: 1.08 } }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <role.icon className="size-5" />
      </motion.div>

      <motion.span
        className="rounded-sm border border-white/10 px-2 py-1 font-mono text-xs font-medium text-slate-300"
        variants={{
          hover: { y: -2, borderColor: "oklch(0.72 0.17 160 / 0.5)" },
        }}
        transition={{ duration: 0.2 }}
      >
        {role.role}
      </motion.span>
    </div>

    <h3 className="text-lg font-semibold text-white">{role.title}</h3>
    <p className="mt-3 text-sm leading-6 text-slate-300">{role.desc}</p>
  </motion.div>
);

const RolesSection = () => (
  <section
    id="roles"
    className="bg-slate-950 px-5 py-18 text-white lg:px-8 lg:py-24"
  >
    <div className="mx-auto max-w-7xl">
      <motion.div
        className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <p className="mb-3 text-sm font-medium text-emerald-300">
            Vận hành theo vai trò
          </p>
          <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
            Cùng một hệ thống, quyết định khác nhau cho từng vai trò.
          </h2>
        </div>
        <p className="text-base leading-7 text-slate-300">
          Admin thiết lập chuẩn vận hành, manager điều phối hàng chờ, staff xử
          lý công việc hiện trường.
        </p>
      </motion.div>

      {/* Bento grid: Admin rộng hơn */}
      <div className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        {ROLES.map((role, index) => (
          <RoleCard key={role.role} role={role} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default RolesSection;
