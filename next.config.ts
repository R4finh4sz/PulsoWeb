import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/invitation/:token", destination: "/invite/:token", permanent: true },
      { source: "/professor/turmas/:path*", destination: "/teacher/classrooms/:path*", permanent: true },
      { source: "/registro", destination: "/registration", permanent: true },
      { source: "/convite/:token", destination: "/invite/:token", permanent: true },
      {
        source: "/admin/registros",
        destination: "/admin/registration-requests", permanent: true,
      },
      {
        source: "/coordenador/registros",
        destination: "/coordinator/registration-requests", permanent: true,
      },
      {
        source: "/coordenador/turmas/nova",
        destination: "/coordinator/classrooms/new", permanent: true,
      },
      {
        source: "/coordenador/turmas/:path*",
        destination: "/coordinator/classrooms/:path*", permanent: true,
      },
      {
        source: "/coordenador/professores/novo",
        destination: "/coordinator/teachers/new", permanent: true,
      },
      {
        source: "/coordenador/professores/:path*",
        destination: "/coordinator/teachers/:path*", permanent: true,
      },
      {
        source: "/coordenador/alunos/novo",
        destination: "/coordinator/students/new", permanent: true,
      },
      { source: "/esqueci-senha", destination: "/forgot-password", permanent: true },
      { source: "/aluno", destination: "/student", permanent: true },
      { source: "/aluno/:path*", destination: "/student/:path*", permanent: true },
      { source: "/coordenador", destination: "/coordinator", permanent: true },
      { source: "/coordenador/:path*", destination: "/coordinator/:path*", permanent: true },
      { source: "/professor", destination: "/teacher", permanent: true },
      { source: "/professor/:path*", destination: "/teacher/:path*", permanent: true },
      {
        source: "/admin/coordenadores/novo",
        destination: "/admin/coordinators/new", permanent: true,
      },
      { source: "/admin/escolas/nova", destination: "/admin/schools/new", permanent: true },
      {
        source: "/admin/coordenadores/:path*",
        destination: "/admin/coordinators/:path*", permanent: true,
      },
      { source: "/admin/escolas/:path*", destination: "/admin/schools/:path*", permanent: true },
    ];
  },
  async rewrites() {
    const backend = (
      process.env.API_BACKEND_URL || "http://localhost:8080"
    ).replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: backend + "/api/:path*" },
    ];
  },
};
export default nextConfig;
