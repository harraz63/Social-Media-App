import multer from "multer";

// Multer Options for Data Storage
export const Multer = () => {
  return multer({ storage: multer.diskStorage({}) });
};
