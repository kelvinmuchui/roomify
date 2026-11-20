import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useOutletContext } from 'react-router';
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants';

interface UploadProps {
    onComplete?: (base64: string) => void;
}

function Upload({ onComplete }: UploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const intervalRef = useRef<number | null>(null);
    const redirectTimeoutRef = useRef<number | null>(null);
    const readerRef = useRef<FileReader | null>(null);
    const progressRef = useRef(0);

    const { isSignedIn } = useOutletContext<AuthContext>();
    const isSignedInRef = useRef(isSignedIn);
    isSignedInRef.current = isSignedIn;

    const clearTimers = () => {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (redirectTimeoutRef.current !== null) {
            window.clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (isSignedIn) return;

        setIsDragging(false);
        setFile(null);
        setProgress(0);
        progressRef.current = 0;
        clearTimers();
        if (readerRef.current?.readyState === FileReader.LOADING) {
            readerRef.current.abort();
        }
        readerRef.current = null;
    }, [isSignedIn]);

    useEffect(() => () => {
        clearTimers();
        if (readerRef.current?.readyState === FileReader.LOADING) {
            readerRef.current.abort();
        }
    }, []);

    const processFile = (selectedFile: File) => {
        if (!isSignedInRef.current) return;

        clearTimers();
        setFile(selectedFile);
        setProgress(0);
        progressRef.current = 0;
        setError('');

        const reader = new FileReader();
        readerRef.current = reader;
        reader.onload = () => {
            readerRef.current = null;
            if (!isSignedInRef.current) return;
            if (typeof reader.result !== 'string') {
                setError('Unable to read this file. Please try another one.');
                setFile(null);
                return;
            }

            const base64 = reader.result;
            intervalRef.current = window.setInterval(() => {
                if (!isSignedInRef.current) {
                    clearTimers();
                    return;
                }

                progressRef.current = Math.min(progressRef.current + PROGRESS_STEP, 100);
                setProgress(progressRef.current);

                if (progressRef.current === 100) {
                    clearTimers();
                    redirectTimeoutRef.current = window.setTimeout(() => {
                        redirectTimeoutRef.current = null;
                        if (isSignedInRef.current) onComplete?.(base64);
                    }, REDIRECT_DELAY_MS);
                }
            }, PROGRESS_INTERVAL_MS);
        };
        reader.onerror = () => {
            readerRef.current = null;
            if (!isSignedInRef.current) return;
            setError('Unable to read this file. Please try again.');
            setFile(null);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedInRef.current) return;
        const selectedFile = event.currentTarget.files?.[0];
        if (selectedFile) processFile(selectedFile);
        event.currentTarget.value = '';
    };

    const handleDrag = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (isSignedInRef.current) setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (isSignedInRef.current) setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (!isSignedInRef.current) return;
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

  return (
    <div className='upload'>
        {!file ?(
            <div
                className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input 
                   type="file"
                   className='drop-input'
                    accept=".jpg, .jpeg, .png"
                   disabled={!isSignedIn }
                   onChange={handleChange}
                /> 
                <div className='drop-content'>
                    <div className='drop-icon'>
                        <UploadIcon size ={20}/>
                    </div>
                    <p>
                        {isSignedIn ?(
                            "Click to upload or drag and drop your floor plan here"
                            ):(
                            "Please sign in to upload your floor plan"
                            )}
                    </p>
                    <p className="help">Maximum file size 50MB</p>
                    {error && <p role="alert">{error}</p>}
                </div>
            </div>
        ):(
            <div className="upload-status">
                <div className='status-content'>
                    <div className="status-icon">
                        {progress === 100 ?(
                            <CheckCircle2 className='check'/>
                        ):(
                            <ImageIcon className='image'/>
                        )}
                    </div>
                    <h3>{file.name}</h3>
                    <div className='progress'>
                        <div className='bar' style ={{ width: `${progress}%`}}/>
                        <p className='status-text'>
                            {progress < 100 ? 'Analyzing Floor Plan ...' : 'Redirecting'}
                        </p>
                    </div>
                </div>

            </div>
        )}
    </div>
  )
}

export default Upload