"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { validateFormInputs } from './lib/helpers.js';
import { createNewUser } from '../actions/createNewUser.js';
import { login } from '../actions/login.js';
import toast, { Toaster } from 'react-hot-toast';

const ErrorObjectContext = createContext();

export default function SignUpModal() {
  const [formIsEmpty, setFormIsEmpty] = useState(true);
  const [formIsSubmittable, setFormIsSubmittable] = useState(false);

  const [formData, setFormData] = useState({
    userFirstName: '',
    userLastName: '',
    userEmail: '',
    userPassword: ''
  });

  const [errorObject, setErrorObject] = useState({
    userFirstName: { message: undefined },
    userLastName: { message: undefined },
    userEmail: { message: undefined },
    userPassword: { message: undefined },
    errorsExist() {
      return Object.keys(this).some((userInputId) => this[userInputId].message !== undefined);
    }
  });

  useEffect(() => {
    validateFormInputs(formData, errorObject, setErrorObject);
    setFormIsSubmittable(!errorObject.errorsExist());
    if (Object.keys(formData).some((userInputId) => formData[userInputId].length > 0)) {
      setFormIsEmpty(false);
    } else {
      setFormIsEmpty(true);
    }
  }, [formData]);

  function displaySignUpError(errorMessage) {
    toast.error(errorMessage);
  }

  function handleOnChange(event) {
    const { id, value } = event.target;
    setFormData({ ...formData, [id]: value });
  }

  async function handleSubmitForm(event) {
    event.preventDefault();

    try {
      const newUser = await createNewUser(formData);
      if (newUser.error) {
        displaySignUpError(newUser.error);
        return;
      }
      login(newUser);
    } catch (error) {
      console.error(error);
      displaySignUpError(`Sorry, we're having issues with signing you up at the moment.`);
    }
  }

  return (
    <>
      <Toaster />
      <div className="modal-backdrop show"></div>
      <div
        className="modal show d-block"
        id="signUpModal"
        aria-labelledby="signUpModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="signUpModalLabel">Sign Up</h5>              
            </div>
            <div className="modal-body">
              <ErrorObjectContext.Provider value={{ errorObject, setErrorObject }}>
                <form onSubmit={handleSubmitForm} className={`${styles.signUpForm} signUpForm`}>
                  <div className="form-floating">
                    <input 
                      className={`form-control ${!formIsEmpty && (errorObject.userFirstName.message ? 'is-invalid' : 'is-valid')}`}
                      id="userFirstName" 
                      type="text" 
                      placeholder="First Name" 
                      value={formData.userFirstName} 
                      onChange={handleOnChange} 
                    />
                    <InputFeedback userInputId={'userFirstName'} />
                    <label htmlFor="userFirstName">First Name</label>
                  </div>
                  <div className="form-floating">
                    <input 
                      className={`form-control ${!formIsEmpty && (errorObject.userLastName.message ? 'is-invalid' : 'is-valid')}`}
                      id="userLastName" 
                      type="text" 
                      placeholder="Last Name" 
                      value={formData.userLastName} 
                      onChange={handleOnChange} 
                    />
                    <InputFeedback userInputId={'userLastName'} />
                    <label htmlFor="userLastName">Last Name</label>
                  </div>
                  <div className="form-floating">
                    <input 
                      className={`form-control ${!formIsEmpty && (errorObject.userEmail.message ? 'is-invalid' : 'is-valid')}`}
                      id="userEmail" 
                      type="email" 
                      placeholder="Email Address" 
                      value={formData.userEmail} 
                      onChange={handleOnChange} 
                    />
                    <InputFeedback userInputId={'userEmail'} />
                    <label htmlFor="userEmail">Email Address</label>
                  </div>
                  <div className="form-floating">
                    <input 
                      className={`form-control ${!formIsEmpty && (errorObject.userPassword.message ? 'is-invalid' : 'is-valid')}`}
                      type="password" 
                      id="userPassword" 
                      placeholder="Password" 
                      value={formData.userPassword} 
                      onChange={handleOnChange} 
                    />
                    <InputFeedback userInputId={'userPassword'} />
                    <label htmlFor="userPassword">Password</label>
                  </div>
                  <div>
                    <button
                      type="submit" 
                      className={`btn btn-${formIsSubmittable ? 'primary' : 'light'}`}
                      disabled={errorObject.errorsExist()}
                    >
                      Create Account
                    </button>
                    <button type="button" className="btn btn-light" onClick={() => setFormData({
                      userFirstName: '',
                      userLastName: '',
                      userEmail: '',
                      userPassword: ''
                    })}>Reset</button>
                  </div>
                </form>
                <p>Already have an account? <Link className="btn btn-primary" href='/signIn'>Sign In</Link></p>
              </ErrorObjectContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InputFeedback({ userInputId }) {
  const { errorObject } = useContext(ErrorObjectContext);

  return (
    <>
      <div className="valid-feedback">
        Looks good!
      </div>
      <div className="invalid-feedback">
        {errorObject[userInputId].message}
      </div>
    </>
  )
}
