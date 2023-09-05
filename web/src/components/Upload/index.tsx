import { useState } from 'react';
import styles from './styles.module.scss';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

type fileState = {
  name: string;
  content: csvValues;
};

type csvValues = Array<{ product_code: string; new_price: string }>;

export function Upload() {
  const [file, setFile] = useState<fileState>({
    name: '',
    content: [],
  });
  function onUploadFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFiles = event.currentTarget.files;

    if (!uploadedFiles) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'O arquivo não foi importado corretamente!',
      });
      return;
    }

    const uploadFile = uploadedFiles[0];
    try {
      Papa.parse(uploadFile, {
        complete: (results) => {
          const data = results.data as csvValues;
          setFile((prevState) => ({ ...prevState, name: uploadFile.name, content: data }));
        },
        skipEmptyLines: true,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Houve um erro tentando converter seu arquivo, verifique-o novamente',
      });
    }
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file.content || file.content.length == 0 || file.name == '') {
      Swal.fire({
        icon: 'warning',
        title: 'Aviso',
        text: 'O arquivo é obrigatório',
      });
    }
    Swal.fire({
      title: 'Aguarde',
      text: 'Estamos validando seu arquivo',
      showConfirmButton: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const result = await fetch('http://localhost:3333/', {
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(file),
      });
      const data = await result.json();
      if (result.status > 299) throw new Error(data.message);
      Swal.close();

      console.log(data);

      Swal.fire({
        icon: 'success',
        title: 'Arquivo conferido com sucesso',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: String(error),
        timer: 3000,
      });
    }
  }

  return (
    <form className={styles.form} onSubmit={handleFormSubmit}>
      <h3 className={styles.title}>Faça o upload do seu arquivo para ser válidado</h3>

      <input type="file" id="file" hidden multiple={false} required onChange={onUploadFileChange} accept=".csv" />
      <label htmlFor="file" className={styles.label}>
        <HiOutlineCloudDownload /> Enviar arquivo
      </label>
      {file && <h5 className={styles.subtitle}>{file.name}</h5>}
      <p>{JSON.stringify(file.content)}</p>
      <button type="submit" className={styles.button} disabled={file.name === ''}>
        Validar
      </button>
    </form>
  );
}
