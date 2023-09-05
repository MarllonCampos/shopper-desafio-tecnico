import { fileState } from '../components/Upload';

export async function validateFile(body: fileState) {
  return await fetch('http://localhost:3333/', {
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
  });
}
