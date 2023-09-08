import { fileState } from '../components/Upload';

export async function validateFile(body: fileState) {
  return await fetch('http://localhost:3333/validate', {
    headers: {
      'content-type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function update(body: fileState) {
  return await fetch('http://localhost:3333/action', {
    headers: {
      'content-type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    method: 'POST',
    body: JSON.stringify(body),
  });
}
