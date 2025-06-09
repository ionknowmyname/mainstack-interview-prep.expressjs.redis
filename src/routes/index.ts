import { Router } from 'express';
import bookRouter from './book.route';
import libraryRouter from './library.route';


const router = Router();

router.use("/book", bookRouter);
router.use("/library", libraryRouter);

export default router;