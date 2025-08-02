import BillingForm from './components/BillingForm';
import BillingTable from './components/BillingTable';

function App() {
  return (
    <p className="w-full h-screen py-6 px-8">
      <div className="flex justify-start items-center pb-8">
        <h1 className="text-3xl font-bold">B.S</h1>
      </div>
      <div className="flex flex-col gap-8">
        {/* billing information form here */}
        <BillingForm />
        {/* billing history table here */}
        <BillingTable />
      </div>
    </p>
  );
}

export default App;
