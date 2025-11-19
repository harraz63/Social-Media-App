import z from "zod"
import { signupSchema } from "../../Validators";


export type SignupBodyType = z.infer<typeof signupSchema.body>;
