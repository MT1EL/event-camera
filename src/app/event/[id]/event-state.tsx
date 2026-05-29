"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Photo = { id: number; src: string; takenAt: number };

type PhotosCtx = {
  photos: Photo[];
  addPhoto: (src: string) => void;
  clearPhotos: () => void;
};

const Ctx = createContext<PhotosCtx | null>(null);

export function EventPhotosProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addPhoto = useCallback((src: string) => {
    setPhotos((prev) => [
      ...prev,
      {
        id: (prev[prev.length - 1]?.id ?? 0) + 1,
        src,
        takenAt: Date.now(),
      },
    ]);
  }, []);

  const clearPhotos = useCallback(() => setPhotos([]), []);

  return (
    <Ctx.Provider value={{ photos, addPhoto, clearPhotos }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePhotos(): PhotosCtx {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("usePhotos must be used within EventPhotosProvider");
  }
  return value;
}
