import { useState } from 'react';
import styles from './styles.module.scss';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import Papa from 'papaparse';
import { validateFile } from '../../services/api';
import { Modals } from '../../modals';

export type fileState = {
  name: string;
  content: csvValues;
};

type csvValues = Array<Array<string>>;

export function Upload() {
  const [file, setFile] = useState<fileState>({
    name: '',
    content: [],
  });
  const [isFileValidated, setIsFileValidate] = useState<boolean>(false);
  function onUploadFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFiles = event.currentTarget.files;
    setIsFileValidate(false);
    if (!uploadedFiles || uploadedFiles.length == 0) {
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
      console.log(error);
      Modals.ErrorWhileParsing();
    }
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file.content || file.content.length == 0 || file.name == '') {
      Modals.WarningFileIsRequired();
    }
    Modals.WaitingValidation();
    try {
      const result = await validateFile(file);
      const data = await result.json();
      if (result.status > 399) throw new Error(data.message);

      console.log(data);

      Modals.FileValidationSuccess();
      setIsFileValidate(true);
    } catch (error) {
      Modals.ErrorWhileValidating(error);
    }
  }
  function valuesFromContent() {
    const [, ...values] = file.content;
    return values;
  }

  function formattedPrice(value: string) {
    const valueAsNumber = Number(value);
    return new Intl.NumberFormat('pt-us', {
      currency: 'brl',
      style: 'currency',
    }).format(valueAsNumber);
  }

  return (
    <form className={styles.form} onSubmit={handleFormSubmit}>
      <h3 className={styles.title}>Faça o upload do seu arquivo para ser válidado</h3>

      <input type="file" id="file" hidden multiple={false} onChange={onUploadFileChange} accept=".csv" />
      <label htmlFor="file" className={styles.label}>
        <HiOutlineCloudDownload /> Enviar arquivo
      </label>
      <button type="submit" className={styles.button} disabled={file.name === ''}>
        Validar
      </button>

      {file.content.length > 0 && <h5 className={styles.subtitle}>{file.name}</h5>}
      {isFileValidated && file.content.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product_Code</th>
              <th>New_Price</th>
            </tr>
          </thead>
          <tbody>
            {valuesFromContent().map(([product_code, new_price], index) => (
              <tr key={`${product_code}-${index}`}>
                <td>{product_code}</td>
                <td>{formattedPrice(new_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}
