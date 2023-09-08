import { useState, useCallback } from 'react';
import styles from './styles.module.scss';
import { HiOutlineCloudDownload } from 'react-icons/hi';
import Papa from 'papaparse';
import { update, validateFile } from '../../services/api';
import { Modals } from '../../modals';

export type fileState = {
  name: string;
  content: csvValues;
};

type csvValues = Array<Array<string>>;

type ResponseData = {
  status: number;
  data: Array<{
    reason: string;
    data: Array<string | number>;
  }>;
};

export function Upload() {
  const [file, setFile] = useState<fileState>({
    name: '',
    content: [],
  });
  const [response, setResponse] = useState<ResponseData>();
  const [isFileValidated, setIsFileValidate] = useState<boolean>(false);

  const valuesCallback = useCallback(() => {
    const [, ...values] = file.content;
    if (response && Number(response.status) > 399) {
      return values.map(([code, price]) => {
        const matchingData = response.data.filter((data) => {
          const ids = data.data.map((id) => String(id));
          return ids.includes(String(code));
        });
        const reasonsForCode = matchingData.map((data) => data.reason);

        return [code, price, reasonsForCode];
      });
    }
    return values;
  }, [file, response]);

  function onUploadFileChange(
    event: React.MouseEvent<HTMLInputElement, MouseEvent> & React.ChangeEvent<HTMLInputElement>
  ) {
    const element = event.target as HTMLInputElement;

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
    } finally {
      element.value = '';
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
      if (result.status > 399) throw data;

      Modals.FileValidationSuccess();
      setIsFileValidate(true);
    } catch (error) {
      Modals.ErrorWhileValidating(error);
    }
  }

  async function handleUpdate() {
    if (!file.content || file.content.length == 0 || file.name == '') {
      Modals.WarningFileIsRequired();
    }
    Modals.WaitingValidation();
    try {
      const result = await update(file);
      const data = await result.json();
      const message = data.message as string;
      const responseData = data.data;
      const status = result.status;
      setResponse((prevState) => ({ ...prevState, status, message, data: responseData }));
      if (result.status > 399) throw data;

      Modals.FileUpdatingSuccess();
      setIsFileValidate(true);
    } catch (error) {
      Modals.ErrorWhileUpdating(error);
    }
  }

  return (
    <>
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
        {isFileValidated && (
          <button type="button" onClick={handleUpdate} className={styles.updateButton}>
            Atualizar
          </button>
        )}
      </form>
      {isFileValidated && file.content.length > 0 && <Table values={valuesCallback()} />}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Table({ values }: { values: any[] }) {
  function formattedPrice(value: string | number) {
    const valueAsNumber = Number(value);
    return new Intl.NumberFormat('pt-us', {
      currency: 'brl',
      style: 'currency',
    }).format(valueAsNumber);
  }

  function openErrorsModal(errors: string[]) {
    Modals.ErrorOnProducts(errors);
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Product_Code</th>
          <th>New_Price</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        {values.map(([product_code, new_price, errors], index) => (
          <tr key={`${product_code}-${index}`}>
            <td>{product_code}</td>
            <td>{formattedPrice(new_price)}</td>

            <td>
              {errors?.length > 0 ? (
                <button className={styles.errorButton} onClick={() => openErrorsModal(errors)}>
                  Ver Erros
                </button>
              ) : (
                <strong>N/A</strong>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
