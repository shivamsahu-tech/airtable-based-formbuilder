import useAuthStore from "../stores/authStore";

export default function Home(){

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    

    return  isAuthenticated  ? ( <div className="w-full text-2xl text-center mt-10"  >
        This is A Airtable form builder where you can create forms and collect responses.
    </div>) :
    ( <div className="w-full text-center text-2xl mt-10"  >
        Please login first to access the form dashboard and other features
    </div>);
}