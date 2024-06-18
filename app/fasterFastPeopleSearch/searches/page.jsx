"use client"
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSearches } from '../actions/fetchSearches.js';
import Link from 'next/link'
import { MdDeleteOutline } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";

export default function MainContent() {
  return (
    <>
      <nav className="navbar bg-dark" data-bs-theme="dark">
        <div className="container-fluid">
          <a className="navbar-brand">Past Searches</a>
          <form className="d-flex" role="search">
            <input className="form-control" type="search" placeholder="Search" aria-label="Search"></input>
            <button className="btn btn-outline-success" type="submit">Search</button>
          </form>
        </div>
      </nav>
      <SearchesContainer />
    </>
  )
}

function SearchesContainer() {
  const [searches, setSearches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ currentPage, setCurrentPage ] = useState(1);
  const startIndex = (currentPage - 1) * 10;
  const maxPages = useRef(null);
  const visibleSearches = searches?.slice(startIndex, currentPage * 10);
  
  useEffect(() => {
    (async () => {
      try {
        const fetchedSearches = await fetchSearches();
        maxPages.current = Math.ceil((fetchedSearches.length / 10));      
        setSearches(fetchedSearches);        
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    })();
  }, []);

  function handlePageNumberClick(pageNumber) {
    if (pageNumber) {
      setCurrentPage(pageNumber);
    }
  }

  function handlePreviousClick() {
    if (currentPage > 1) {      
      setCurrentPage(currentPage - 1);
    }
  }

  function handleNextClick() {     
    if (currentPage !== maxPages.current) {
      setCurrentPage(currentPage + 1);
    }
  }

  return (
    <>
      {loading && <p>Loading Your Searches...</p>}
      {!loading && <div>
        <ul className="d-flex flex-wrap justify-content-center" style={{gap: '.25rem'}}>
          {visibleSearches.map((search, index) => {
            return <SearchItem key={index} search={search}/>
          })}
        </ul>        
        <div className="d-flex justify-content-center align-items-center" style={{margin: '0 auto'}}>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 && 'disabled'}`} onClick={handlePreviousClick}>
              <a className="page-link" href="#">Previous</a>
            </li>
            {Array.from(Array(maxPages.current), (_, index) => {
              const pageNumber = index + 1;

              return (
                <li
                  key={index}
                  className={`page-item ${currentPage === pageNumber && `active`}`}
                  onClick={handlePageNumberClick.bind(null, pageNumber)}>
                  <a className="page-link" href="#">{pageNumber}</a>
                </li>
              )
            })}
            <li className={`page-item ${currentPage === maxPages.current && `disabled`}`} onClick={handleNextClick}>
              <a className="page-link" href="#">Next</a>
            </li>
          </ul>
        </div>       
      </div>}
    </>
  )
}

function SearchItem({ search }) {
  const [ searchItemHovered, setSearchitemHovered ] = useState(false);
  const router = useRouter();

  function handleDeleteSearch() {
    
  }

  function handleLinkMouseEnter(event) {
    if (event.target === event.currentTarget) {
      event.target.style.textDecoration = 'underline';
      event.target.style.cursor = 'pointer'; // Corrected property name
    }    
  }

  function handleLinkMouseLeave(event) {
    if (event.target === event.currentTarget) {
      event.target.style.textDecoration = 'none';
      event.target.style.cursor = 'pointer'; // Corrected property name
    }
  }

  function handleSearchItemMouseEnter(event) {
    event.currentTarget.style.backgroundColor = '#F5F8FA';
    event.currentTarget.style.cursor = 'pointer';    
    setSearchitemHovered(true);
  }

  function handleSearchItemMouseLeave(event) {
    event.currentTarget.style.backgroundColor = 'white';
    setSearchitemHovered(false);
  }

  function handleSearchItemClick(searchId, event) {
    event.preventDefault();
    router.push(`/fasterFastPeopleSearch/searches/${searchId}`);
  }
  
  return (
    <li
      className="d-flex flex-column align-items-start"
      style={{border: '1px solid grey', padding: '.5rem', borderRadius: '.25rem', gap: '.25rem'}}
      onClick={handleSearchItemClick.bind(null, search.id)}
      onMouseEnter={handleSearchItemMouseEnter}
      onMouseLeave={handleSearchItemMouseLeave}>
      <div className="d-flex flex-column align-items-start">
        <div className="d-flex align-items-start justify-content-between" style={{width: '100%'}}>
          <h6>
            <Link
              style={{color: '#0091AE', textDecoration: 'none'}}
              href="#"
              onMouseEnter={handleLinkMouseEnter}
              onMouseLeave={handleLinkMouseLeave}>
              {search["search_name"]}
            </Link>
          </h6>
          <div className="d-flex justify-items-end align-items-center">
            <HiDotsVertical />
          </div>          
        </div>
        <ul className="list-group" style={{textAlign: 'start'}}>
          <li className="list-group-item"><strong>Date Created: </strong>{search["created_at"].toDateString()}</li>
          <li className="list-group-item"><strong>Number of Contacts: </strong>{search["search_data"].length}</li>
        </ul>
      </div>
      <div style={{width: '90%', outline: '1px solid grey', margin: '0 auto'}}></div>
      <div className="d-flex align-items-center">

      </div>
    </li>
  )
}

/*
 <li className={`card d-flex flex-column align-items-start`} style={{padding: '.5rem'}}>
  <div className="card-body d-flex align-items-start justify-content-between" style={{width: '100%'}}>
    <h4 className="card-title">{search["search_name"]}</h4>
    <BsThreeDotsVertical />
  </div>
  <div className="card-body">
    <ul className="list-group" style={{textAlign: 'start'}}>
      <li className="list-group-item"><strong>Date Created: </strong>{search["created_at"].toDateString()}</li>
      <li className="list-group-item"><strong>Number of Contacts: </strong>{search["search_data"].length}</li>
    </ul>
  </div>
  <div className="d-flex justify-content-between align-items-center" style={{gap: '.5rem', width: '100%'}}>
    <button
      className="btn btn-success"
      onClick={handleSearchItemClick.bind(null, search.id)}>
      See Contacts
    </button>
    <button 
      className="btn btn-light"
      type="button"
      data-bs-toggle="modal"
      data-bs-target={`#delete`}>
      <BsFillTrash3Fill />
    </button>
  </div>
</li>
*/