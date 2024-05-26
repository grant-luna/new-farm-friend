"use client"
import styles from './page.module.css';
import { useState, createContext, useContext } from 'react';
import Papa from "papaparse";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  generateSampleRow,
  generateRequiredHeaderSampleValue,
  processFileForDatabase,
  resultsAreGenerateable
} from './lib/helpers.js';


const FileContext = createContext();

export default function MainContent() {
  const [ parsedCsvFile, setParsedFile ] = useState(null);

  function handleFileSelection(event) {
    const selectedFile = event.target.files[0];

    Papa.parse(selectedFile, {
      header: true,
      complete: (result) => {
        setParsedFile(result.data);
      },
    });
  }
  
  return (
    <>
      <FileContext.Provider value={{parsedCsvFile, setParsedFile}}>
        {!parsedCsvFile && <input className={styles.fileInput} type='file' accept='.csv' onChange={handleFileSelection}></input>}
        {parsedCsvFile && <FileMatchMenu parsedCsvFile={parsedCsvFile} setParsedFile={setParsedFile}/>}
      </FileContext.Provider>
    </>
  );
}

const SetIsGeneratableContext = createContext();
const MatchedColumnHeadersContext = createContext();

function FileMatchMenu() {
  const { parsedCsvFile } = useContext(FileContext);
  const [ isGeneratable, setIsGeneratable ] = useState(false);
  const router = useRouter();

  const [ matchedColumnHeaders, setMatchedColumnHeaders ] = useState({
    "Primary Address": {"Address": [], "City / State": []},
    "Owner Names": {"First Owner": [], "Second Owner": []},
    "Mail Address": {"Address": [], "City / State": []},
  });

  const matchedColumnHeadersKeys = Object.keys(matchedColumnHeaders);

  async function handleGenerateResults() {
    if (isGeneratable) {
      const processedFile = processFileForDatabase(parsedCsvFile, matchedColumnHeaders);
      
      try {
        const response = await fetch('/fasterFastPeopleSearch/createSearch/api', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processedFile),
        });

        const responseData = await response.json();
        
        const insertedData = responseData.rows[0];
        const searchId = insertedData.id;
        router.push(`/fasterFastPeopleSearch/searches/${searchId}`);
      } catch (error) {
        console.error('Error while generating results:', error);
      }
    }
  }

  return (
    <SetIsGeneratableContext.Provider value={setIsGeneratable}>
      <MatchedColumnHeadersContext.Provider value={{ matchedColumnHeaders, setMatchedColumnHeaders }}>
        <h3>File Matcher</h3>
        <p>
          Thank you for uploading your file! Could you please help us
          generate your search results by helping us make sense of the
          file you uploaded?
        </p>
        <p>
          At minimum, we require a <strong>Primary Address</strong> (address, city, and state)
          to generate results.
        </p>
        <p>
          For best results, please provide matching information for a Primary Address, Owner Name(s), and a Mail Address.
        </p>
        <ul className="accordion" id="accordionMenu">
          {matchedColumnHeadersKeys.map((matchedColumnHeaderKey, index) => {
            const requiredHeaders = Object.keys(matchedColumnHeaders[matchedColumnHeaderKey]);
            return (
              <li key={index} className="accordion-item">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed" 
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#accordion-item-${index}`}
                          aria-expanded="false"
                          aria-controls={`accordion-item-${index}`}
                  >
                    {matchedColumnHeaderKey}
                  </button>
                </h2>
                <AccordionBody toggleId={index} requiredHeaders={requiredHeaders} matchedColumnHeaderKey={matchedColumnHeaderKey}/>
              </li>
            );
          })}
        </ul>
        <button onClick={handleGenerateResults}
                className={`btn btn-primary ${styles.generateResultsButton}`}
                disabled={!isGeneratable}
                type="button">
                Generate Results
        </button>
      </MatchedColumnHeadersContext.Provider>
    </SetIsGeneratableContext.Provider>
  );
}

function AccordionBody({ toggleId, requiredHeaders, matchedColumnHeaderKey }) {
  return (
    <div id={`accordion-item-${toggleId}`} className="accordion-collapse collapse" data-bs-parent="#accordionMenu">
      <div className="accordion-body">
        <ul className={`${styles.requiredHeaders} list-group`}>
          {requiredHeaders.map((requiredHeader, index) => {
            const uniqueId = uuidv4();
            
            return (
              <li key={index}>
                <RequiredHeader requiredHeader={requiredHeader} uniqueId={uniqueId}/>
                <RequiredHeaderModal requiredHeader={requiredHeader} matchedColumnHeaderKey={matchedColumnHeaderKey} uniqueId={uniqueId}/>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function RequiredHeader({ requiredHeader, uniqueId }) {
  function handleRequiredHeaderClick(event) {
    event.preventDefault();
  }

  return (
    <div
        onClick={handleRequiredHeaderClick}
        className={`${styles.requiredHeader} list-group-item`}
        data-bs-toggle="modal"
        data-bs-target={`#${uniqueId}`}
    >
      <input className="form-check-input" type="checkbox" value=""/>
      <label className="form-check-label">{requiredHeader}</label>
    </div>
  );
}

function RequiredHeaderModal({ requiredHeader, matchedColumnHeaderKey, uniqueId }) {
  const { parsedCsvFile } = useContext(FileContext);
  const setIsGeneratable = useContext(SetIsGeneratableContext);
  const matchedColumnHeaderContext = useContext(MatchedColumnHeadersContext);
  const sampleRow = generateSampleRow(parsedCsvFile);
  const requiredHeaderSampleValue = generateRequiredHeaderSampleValue(matchedColumnHeaderContext.matchedColumnHeaders[matchedColumnHeaderKey][requiredHeader], sampleRow)

  function handleResetMatchedColumnHeaders(requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext, event) {
    event.preventDefault();

    const { matchedColumnHeaders, setMatchedColumnHeaders} = { ...matchedColumnHeaderContext };
    setMatchedColumnHeaders({...matchedColumnHeaders, [matchedColumnHeaderKey]: {...matchedColumnHeaders[matchedColumnHeaderKey], [requiredHeader]: []}});
    if (matchedColumnHeaderKey === 'Primary Address') setIsGeneratable(false);
  }

  function handleSampleColumnClick(requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext, event) {
    const isSampleColumn = event.target.closest('li').classList.contains('sample-column')

    if (isSampleColumn) {
      event.preventDefault();

      const { matchedColumnHeaders, setMatchedColumnHeaders} = { ...matchedColumnHeaderContext };
      const matchedColumnHeaderKeyMatchedColumns = [...matchedColumnHeaders[matchedColumnHeaderKey][requiredHeader]];
      const sampleColumn = event.target.closest('li');
      const [ sampleColumnHeader, sampleColumnValue ] = [...sampleColumn.children].map((child) => child.textContent);
      matchedColumnHeaderKeyMatchedColumns.push(sampleColumnHeader);
      
      setMatchedColumnHeaders({...matchedColumnHeaders, [matchedColumnHeaderKey]: {...matchedColumnHeaders[matchedColumnHeaderKey], [requiredHeader]: matchedColumnHeaderKeyMatchedColumns}});
    }
  }

  function handleSampleColumnHover(event) {
    const sampleColumn = event.currentTarget;

    sampleColumn.classList.add('active');
    sampleColumn.style.cursor = 'pointer';
  }

  function handleSampleColumnUnHover(event) {
    const sampleColumn = event.currentTarget;

    sampleColumn.classList.remove('active');
    sampleColumn.style.cursor = 'default';
  }

  function handleSaveMatchedColumnHeaders(requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext) {
    const requiredHeaderInput = [...document.querySelectorAll(`.accordion-body .form-check-input`)].filter((requiredHeaderInput) => {
      return requiredHeaderInput.nextElementSibling.textContent === requiredHeader;
    }).find((requiredHeaderInput) => {
      const accordionHeaderText = requiredHeaderInput.closest('li.accordion-item').querySelector('h2.accordion-header')?.textContent;
      return matchedColumnHeaderKey === accordionHeaderText;
    });

    const requiredHeaderColumnsMatched = matchedColumnHeaderContext.matchedColumnHeaders[matchedColumnHeaderKey][requiredHeader].length > 0;
    requiredHeaderInput.checked = requiredHeaderColumnsMatched ? true : false;

    setIsGeneratable(resultsAreGenerateable(matchedColumnHeaderContext) ? true : false)
  }

  return (
    <div className="modal fade" data-bs-backdrop="static" id={uniqueId} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
              <h5 className="modal-title">Matching {requiredHeader}</h5>
              <button onClick={handleSaveMatchedColumnHeaders.bind(null, requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext)} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <h6>Current Match: {requiredHeaderSampleValue}</h6>
              <ul className={`${styles.sampleColumns} list-group`} onClick={handleSampleColumnClick.bind(null, requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext)}>
                {sampleRow.map((column, index) => (
                  <li
                      onMouseOver={handleSampleColumnHover}
                      onMouseLeave={handleSampleColumnUnHover}
                      className={`${styles.sampleColumn} list-group-item sample-column`}
                      key={index}
                    >
                    <h4><strong>{column.header}</strong></h4>
                    <p>{column.value}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button onClick={handleResetMatchedColumnHeaders.bind(null, requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext)} type="button"  className="btn btn-light">Reset</button>
              <button onClick={handleSaveMatchedColumnHeaders.bind(null, requiredHeader, matchedColumnHeaderKey, matchedColumnHeaderContext)} type="button" data-bs-dismiss="modal" className="btn btn-primary">Save</button>
            </div>
          </div>
      </div>
    </div>
  )
}

/*

function AccordionItem({ inputTypeProps, itemName, toggleId, parsedCsvFile, toggleGeneratableStateProps}) {
  const [requiredHeaders, setRequiredHeaders] = useState(inputTypeProps.inputTypes[itemName]);
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className={`${styles.accordionItem} accordion-item`}>
      <h2 className="accordion-header">
        <button className="accordion-button collapsed" type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#${toggleId}`}
          aria-expanded="false"
          aria-controls={toggleId}>
          {itemName}
        </button>
      </h2>
      <div id={toggleId} className={`accordion-collapse collapse`} data-bs-parent="#accordionExample">
        <div className={`${styles.inputTypeMatcherMenu} accordion-body`}>
          <ul className={`${styles.requiredHeaders} list-group`}>
            {Object.keys(requiredHeaders).map((requiredHeader, index) => {
              const uniqueKey = uuidv4();
              
              return (
                <li key={index}>
                  <RequiredHeader index={index} requiredHeader={requiredHeader} requiredHeaders={requiredHeaders} uniqueKey={uniqueKey} />
                  <RequiredHeaderModal requiredHeader={requiredHeader} 
                                       itemName={itemName}
                                       requiredHeaders={requiredHeaders}
                                       setRequiredHeaders={setRequiredHeaders}
                                       toggleGeneratableStateProps={toggleGeneratableStateProps}
                                       inputTypeProps={inputTypeProps} 
                                       uniqueKey={uniqueKey} 
                                       sampleRow={sampleRow}
                                       setIsCompleted={setIsCompleted}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function RequiredHeader({ index, requiredHeader, requiredHeaders, uniqueKey }) {
  function columnsSelected(requiredHeader, requiredHeaders) {
    return requiredHeaders[requiredHeader].length > 0;
  }

  function handleRequiredHeaderClick(event) {
    event.preventDefault();
  }

  return (
    <div key={index}
        onClick={handleRequiredHeaderClick}
        className={`${styles.requiredHeader} list-group-item`}
        data-bs-toggle="modal"
        data-bs-target={`#matcherModal${uniqueKey}`}
    >
      <input checked={columnsSelected(requiredHeader, requiredHeaders) ? true : false} className="form-check-input me-1" type="checkbox" value="" id={`checkbox${uniqueKey}`} />
      <label className="form-check-label" htmlFor={`checkbox${uniqueKey}`}>{requiredHeader}</label>
    </div>
  );
}

function RequiredHeaderModal({ requiredHeader, itemName, requiredHeaders, setRequiredHeaders, toggleGeneratableStateProps, inputTypeProps, uniqueKey, sampleRow, setIsCompleted }) {
  function checkIfCompleted(itemName) {
    if (itemName === 'Owner Names') {
      if (Object.keys(requiredHeaders).some((requiredHeader) => requiredHeaders[requiredHeader].length > 0 )) {
        setIsCompleted(true);
      }
    } else if (itemName === 'Primary Address' || itemName === 'Mail Address') {
      if (Object.keys(requiredHeaders).every((requiredHeader) => requiredHeaders[requiredHeader].length > 0)) {
        setIsCompleted(true);

        if (itemName === 'Primary Address') {
          toggleGeneratableStateProps.setIsGeneratable(true);
        }
      }
    }
  }

  function handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps) {
    inputTypeProps.setInputTypes({...inputTypeProps.inputTypes, [itemName]: {...requiredHeaders}});
    checkIfCompleted(itemName);
  }

  return (
    <div className="modal fade" id={`matcherModal${uniqueKey}`} data-bs-backdrop="static">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Matching {requiredHeader}</h5>
            <button type="button" onClick={() => handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps)} className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <h6>Current Match: {generateCurrentMatch(requiredHeaders, requiredHeader, sampleRow)}</h6>
            <ul onClick={handleSampleColumnClick.bind(null, requiredHeader)} className={`${styles.sampleColumns} list-group`}>
              {sampleRow.map((column, index) => (
                <li onMouseOver={handleSampleColumnHover}
                    onMouseLeave={handleSampleColumnUnHover}
                    className={`${styles.sampleColumn} list-group-item d-flex justify-content-between align-items-start`}
                    key={index}
                  >
                  <h4><strong>{column.header}</strong></h4>
                  <p>{column.value}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={(event) => handleResetRequiredHeaderMatch(requiredHeader)} className="btn btn-light">Reset</button>
            <button type="button" onClick={(event) => handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps)} data-bs-dismiss="modal" className="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

*/

/*
function RequiredHeaderModal({ requiredHeader, itemName, requiredHeaders, setRequiredHeaders, toggleGeneratableStateProps, inputTypeProps, uniqueKey, sampleRow, setIsCompleted }) {
  function checkIfCompleted(itemName) {
    if (itemName === 'Owner Names') {
      if (Object.keys(requiredHeaders).some((requiredHeader) => requiredHeaders[requiredHeader].length > 0 )) {
        setIsCompleted(true);
      }
    } else if (itemName === 'Primary Address' || itemName === 'Mail Address') {
      if (Object.keys(requiredHeaders).every((requiredHeader) => requiredHeaders[requiredHeader].length > 0)) {
        setIsCompleted(true);

        if (itemName === 'Primary Address') {
          toggleGeneratableStateProps.setIsGeneratable(true);
        }
      }
    }
  }

  function generateCurrentMatch(requiredHeaders, requiredHeader, sampleRow) {
    return requiredHeaders[requiredHeader].map((columnHeader) => {
      return sampleRow.find((row) => row.header === columnHeader).value;
    }).join(' ');
  }

  function handleResetRequiredHeaderMatch(requiredHeader) {
    setRequiredHeaders({...requiredHeaders, [requiredHeader]: []});
    toggleGeneratableStateProps.setIsGeneratable(false);
  }

  function handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps) {
    inputTypeProps.setInputTypes({...inputTypeProps.inputTypes, [itemName]: {...requiredHeaders}});
    checkIfCompleted(itemName);
  }

  function handleSampleColumnClick(requiredHeader, event) {
    if (event.target.parentNode.tagName === 'LI' || event.target.tagName === 'LI') {
      event.preventDefault();

      const sampleColumn = event.target.closest('li');
      const [ sampleColumnHeader, sampleColumnValue ] = [...sampleColumn.children].map((child) => child.textContent);
      const requiredHeadersCopy = { ...requiredHeaders }
      requiredHeadersCopy[requiredHeader].push(sampleColumnHeader);
      
      setRequiredHeaders({ ...requiredHeaders, [requiredHeader]: requiredHeadersCopy[requiredHeader]} );
    }
  }

  function handleSampleColumnHover(event) {
    const sampleColumn = event.currentTarget;

    sampleColumn.classList.add('active');
    sampleColumn.style.cursor = 'pointer';
  }

  function handleSampleColumnUnHover(event) {
    const sampleColumn = event.currentTarget;

    sampleColumn.classList.remove('active');
    sampleColumn.style.cursor = 'default';
  }

  return (
    <div className="modal fade" id={`matcherModal${uniqueKey}`} data-bs-backdrop="static">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Matching {requiredHeader}</h5>
            <button type="button" onClick={() => handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps)} className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <h6>Current Match: {generateCurrentMatch(requiredHeaders, requiredHeader, sampleRow)}</h6>
            <ul onClick={handleSampleColumnClick.bind(null, requiredHeader)} className={`${styles.sampleColumns} list-group`}>
              {sampleRow.map((column, index) => (
                <li onMouseOver={handleSampleColumnHover}
                    onMouseLeave={handleSampleColumnUnHover}
                    className={`${styles.sampleColumn} list-group-item d-flex justify-content-between align-items-start`}
                    key={index}
                  >
                  <h4><strong>{column.header}</strong></h4>
                  <p>{column.value}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={(event) => handleResetRequiredHeaderMatch(requiredHeader)} className="btn btn-light">Reset</button>
            <button type="button" onClick={(event) => handleSaveRequiredHeaderMatch(event, itemName, requiredHeaders, inputTypeProps)} data-bs-dismiss="modal" className="btn btn-primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
*/

/*

function RequiredHeader({ index, requiredHeader, requiredHeaders, uniqueKey }) {
  function columnsSelected(requiredHeader, requiredHeaders) {
    return requiredHeaders[requiredHeader].length > 0;
  }

  function handleRequiredHeaderClick(event) {
    event.preventDefault();
  }

  return (
    <div key={index}
        onClick={handleRequiredHeaderClick}
        className={`${styles.requiredHeader} list-group-item`}
        data-bs-toggle="modal"
        data-bs-target={`#matcherModal${uniqueKey}`}
    >
      <input checked={columnsSelected(requiredHeader, requiredHeaders) ? true : false} className="form-check-input me-1" type="checkbox" value="" id={`checkbox${uniqueKey}`} />
      <label className="form-check-label" htmlFor={`checkbox${uniqueKey}`}>{requiredHeader}</label>
    </div>
  );
}

*/

/*
function FileMatchMenu({ parsedCsvFile }) {
  const [isGeneratable, setIsGeneratable] = useState(false);
  const toggleGeneratableStateProps = { isGeneratable, setIsGeneratable };
  const router = useRouter();

  const [ inputTypes, setInputTypes ] = useState({
    "Primary Address": {"Address": [], "City / State": []},
    "Owner Names": {"First Owner": [], "Second Owner": []},
    "Mail Address": {"Address": [], "City / State": []},
  });

  const inputTypeProps = { inputTypes, setInputTypes };

  async function handleGenerateResultsButtonClick() {
    if (isGeneratable) {

      const processedFile = JSON.stringify(parsedCsvFile.map((row) => {
        const primaryAddressLink = createFastPeopleSearchLink(row, inputTypes["Primary Address"]);
        const mailAddressLink = createFastPeopleSearchLink(row, inputTypes["Mail Address"]);

        return {
          primaryAddressLink,
          mailAddressLink,
          primaryAddress: {
            address: inputTypes["Primary Address"]["Address"].map((header) => row[header]).join(' '),
            cityState: inputTypes["Primary Address"]["City / State"].map((header) => row[header]).join(' '),
          },
          mailAddress: {
            address: inputTypes["Mail Address"]["Address"].map((header) => row[header]).join(' '),
            cityState: inputTypes["Mail Address"]["City / State"].map((header) => row[header]).join(' '),
          },
          ownerNames: {
            firstOwner: inputTypes["Owner Names"]["First Owner"].map((header) => row[header]).join(' '),
            secondOwner: inputTypes["Owner Names"]["Second Owner"].map((header) => row[header]).join(' '),
          }
        }
      }));
      
      try {
        const response = await fetch('/fasterFastPeopleSearch/createSearch/api', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: processedFile,
        });

        const responseData = await response.json()
        const insertedData = responseData.rows[0];
        const searchId = insertedData.id;
        router.push(`/fasterFastPeopleSearch/searches/${searchId}`);
      } catch (error) {
        console.error('Error while generating results:', error);
      }
    }
  }
  
  function createFastPeopleSearchLink(fileRow, headers) {
    const addressHeaders = headers["Address"];
    const cityStateHeaders = headers["City / State"];

    const address = addressHeaders.map((addressHeader) => {
      return fileRow[addressHeader]?.replace(/[^0-9a-z ]/gi, '');
    }).join(' ')

    const cityState = cityStateHeaders.map((cityStateHeader) => {
      return fileRow[cityStateHeader];
    }).join(' ');
    
    return `http://www.fastpeoplesearch.com/address/${address}_${cityState}`.replace(/ /g, '-');
  }

  return (
    <>
      <h3>File Matcher</h3>
      <p>
        Thank you for uploading your file! Could you please help us
        generate your search results by helping us make sense of the
        file you uploaded?
      </p>
      <p>
        At minimum, we require a <strong>primary address</strong> (address, city, and state) to be able
        to generate results.  For best results, please provide matching
        information for the primary address, owner names, and mail
        address (if they exist).
      </p>
      <button onClick={handleGenerateResultsButtonClick} className={`btn btn-primary ${styles.generateResultsButton}`} disabled={!isGeneratable} type="button">Generate Results</button>
      <ul className="accordion" id="accordionExample">
        < AccordionItem key={1}
                        inputTypeProps={inputTypeProps}
                        itemName={"Primary Address"}
                        toggleId={"collapseOne"}
                        parsedCsvFile={parsedCsvFile}
                        toggleGeneratableStateProps={toggleGeneratableStateProps}
        />
        < AccordionItem key={2} 
                        inputTypeProps={inputTypeProps}
                        itemName={"Owner Names"}
                        toggleId={"collapseTwo"}
                        parsedCsvFile={parsedCsvFile}
                        toggleGeneratableStateProps={toggleGeneratableStateProps}
        />
        < AccordionItem key={3}
                        inputTypeProps={inputTypeProps}
                        itemName={"Mail Address"}
                        toggleId={"collapseThree"}
                        parsedCsvFile={parsedCsvFile}
                        toggleGeneratableStateProps={toggleGeneratableStateProps}
        />
      </ul>
    </>
  )
*/