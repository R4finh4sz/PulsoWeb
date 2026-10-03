import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (
      process.env.API_BACKEND_URL || "http://localhost:8080"
    ).replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: backend + "/api/:path*" },
      { source: "/registro", destination: "/registration" },
      { source: "/convite/:token", destination: "/invitation/:token" },
      {
        source: "/admin/registros",
        destination: "/admin/registration-requests",
      },
      {
        source: "/coordenador/registros",
        destination: "/coordinator/registration-requests",
      },
      {
        source: "/coordenador/turmas/nova",
        destination: "/coordinator/classrooms/new",
      },
      {
        source: "/coordenador/turmas/:path*",
        destination: "/coordinator/classrooms/:path*",
      },
      {
        source: "/coordenador/professores/novo",
        destination: "/coordinator/teachers/new",
      },
      {
        source: "/coordenador/professores/:path*",
        destination: "/coordinator/teachers/:path*",
      },
      {
        source: "/coordenador/alunos/novo",
        destination: "/coordinator/students/new",
      },
      { source: "/esqueci-senha", destination: "/forgot-password" },
      { source: "/aluno", destination: "/student" },
      { source: "/aluno/:path*", destination: "/student/:path*" },
      { source: "/coordenador", destination: "/coordinator" },
      { source: "/coordenador/:path*", destination: "/coordinator/:path*" },
      { source: "/professor", destination: "/teacher" },
      { source: "/professor/:path*", destination: "/teacher/:path*" },
      {
        source: "/admin/coordenadores/novo",
        destination: "/admin/coordinators/new",
      },
      { source: "/admin/escolas/nova", destination: "/admin/schools/new" },
      { source: "/admin/terms/edit", destination: "/admin/terms/edit" },
      { source: "/admin/classrooms/new", destination: "/admin/classrooms/new" },
      {
        source: "/coordinator/teachers/new",
        destination: "/coordinator/teachers/new",
      },
      {
        source: "/coordinator/classrooms/new",
        destination: "/coordinator/classrooms/new",
      },
      {
        source: "/admin/coordenadores/:path*",
        destination: "/admin/coordinators/:path*",
      },
      { source: "/admin/escolas/:path*", destination: "/admin/schools/:path*" },
      { source: "/admin/terms/:path*", destination: "/admin/terms/:path*" },
      {
        source: "/admin/classrooms/:path*",
        destination: "/admin/classrooms/:path*",
      },
    ];
  },
};
export default nextConfig;
