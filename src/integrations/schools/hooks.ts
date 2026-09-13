"use client";

import { useQuery } from "@tanstack/react-query";
import { schoolsApi } from "./api";

export function useSchools(enabled = true) {
  return useQuery({ queryKey: ["schools"], queryFn: ({ signal }) => schoolsApi.list(signal), enabled });
}