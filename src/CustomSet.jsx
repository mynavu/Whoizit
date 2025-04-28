import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient';


export function CustomSet({ createSet, setCreateSet, session }) {
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentName, setCurrentName] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [customCards, setCustomCards] = useState([]);
    const formRef = useRef();
    const [upload, setUpload] = useState(false);
    const fileInputRef = useRef();
    //session.user.user_metadata;
    const defaultCards = [
        'https://media-hosting.imagekit.io/e880a3a7b3b346a1/1.png?Expires=1840253275&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=Sa12uM5xRfbqabBWSyRVXKS-zYVnoaYDgjAcEMdBbd0oUJcq5pw0kBypc-kP680flMFJ18je6aF8x4dIZ~CEPav9iUEY0qQGyM2un8s4MrSJZLAwV0rAyD9Rw7jvyQRSgA3cXRjmBf~Ay~Pugh87ldy4nApKKHoQDUviImI3lkE4hOJYdrHRoDQ8j8GYkZdP51ONhZmZXpcIPM9nG8snrCcA8j6gnbA2nHO5NSB6IsAzAeh-ZM9MxJcVrWORoyrn1G-eVq6irLmqHXZI~KEq0AhQYFDVOZ6rNBTSCbFKVObXJq4oc-fVZ4klB88Wi1Agixdb7BittAE~KmSjJZfe~g__',
        'https://media-hosting.imagekit.io/c9fb4076878e450e/2.png?Expires=1840253476&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=qowqYySb7IS5ldZPJEviQZAHGO7tQErPW-ivMo6TYTao~~SGBrYjO4-bmmfETU-CMGHJgCfIAIiwIQnq-SDtQSQb3OXtgIoeYtKgLqhDLAOSs2KHoXreXEoaQMhAmBSWkpT3u6HR6KVuyiitm34T36kJ3k49VwRowvr~jdDUIlVcp-vqHvfzPx6fnIqnqlo99hfgWpBYBbGjtrylNI3nRCeo0IJKCpQQ3ZxnjoJv4iUbTCefQ6UrVoQKq5EPocq2H9CgJMsoega2tcnKD1A07Hy9p-j3FgZH7eArctF~c3aZQEnD1PjEtG3oCvGZeKOtss7976ZtenU~oWtMmsSExA__',
        'https://media-hosting.imagekit.io/52a359c5f0254d63/3.png?Expires=1840253502&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=iSlGoU4ig3lpv-1HNswdaF3Pwva6KaBuAYK-gYIStmYKR~Dni6cmn4iLI2IinRIO5SwLlbasFdAanOUBy7l4yLM3TGl9djWwXEoAM74AFhzLBGnuPSV74-h3cqBQyMrCW8RwSekD0Hj-sgdgakxVRNi5oNg4UMRNowgQyZjIoEZrHz0ZIN~DeVeifxkAo72PCUikIut1ZmXhdMJyQQRlg9eVjeywf1bg-1SJiwQvRnaCG9ilkyRaL28U6kDSL5KBU4fK1mNL4HlU1SnVfJHEg3DgjFlsp3xnBv9T2to1W~WTUP7Q3f3oTE7swLgStC6i2yyIqxGAPh437cL549GaAA__'
     ]


    function addToSet() {    
        if (currentUrl.trim() !== '') {
            setCustomCards((prevCards) => [...prevCards, {name: currentName, image_url: currentUrl, card_id: crypto.randomUUID()}]);
        } else {
            let randomIndex = (Math.round(Math.random() * 100) % 3)
            setCustomCards((prevCards) => [...prevCards, {name: currentName, image_url: defaultCards[randomIndex], card_id: crypto.randomUUID()}]);
        }
        formRef.current.reset();
        setCurrentName("");
        setCurrentUrl("");
        setUpload(false);
    }

    function deleteCard(id) {
        setCustomCards((prevCards) => prevCards.filter(card => card.card_id !== id));
    }


    async function uploadFile(file_input) {
        setUpload(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentUrl(reader.result);
        };
        reader.readAsDataURL(file_input);
    }

    function clearUploadInput() {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    async function addCustomSet() {
        if (currentTitle.trim() === '') {
          alert('Give the set a name');
          return;
        }
        if (customCards.length === 0) {
            alert('A set cannot be empty');
            return;
        }
        const userEmail = session?.user?.user_metadata?.email || null;
        try {
          // 1. Insert new set into public_card_sets
          const { data: newSet, error: setError } = await supabase
            .from('public_card_sets')
            .insert({ name: currentTitle, public: false, user_email: userEmail })
            .select('id')
            .single();

      
          if (setError) throw setError;
          const newSetId = newSet.id;
      
          // 2. Insert cards into cards table
          const cardInsertData = customCards.map(({ name, image_url }) => ({ name, image_url }));
          const { data: insertedCards, error: cardsError } = await supabase
            .from('cards')
            .insert(cardInsertData)
            .select('id');
      
          if (cardsError) throw cardsError;
      
          // 3. Insert into cards_in_sets
          
          const cardInSetData = insertedCards.map((card, index) => ({
            card_set_id: newSetId,
            card_id: card.id,
          }));
      
          const { error: linkError } = await supabase
            .from('cards_in_sets')
            .insert(cardInSetData);
      
          if (linkError) throw linkError;
      
          alert('Custom set successfully added!');
          setCustomCards([]);
          setCurrentTitle('');
          setCurrentName("");
          setCurrentUrl("");
          setUpload(false);
        } catch (error) {
          console.error('Error adding custom set:', error);
          alert('Failed to add custom set. Check the console for details.');
        }
      }
      
    return (
        <div className=" margin-top flex flex-col items-center gap-5">
            <div>
                <label htmlFor='setTitle'>Name of Set:</label>
                <input className="bg-white rounded-md text-sm w-full" id='setTitle' value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)}/>
            </div>
            <p>Add New Card</p>
            <form className='flex flex-col justify-center gap-3 blue-border rounded-2xl padding-l'
            ref={formRef}
            onSubmit={(e) => {
                e.preventDefault();
                addToSet();
            }}
            >
                <div>
                    <label htmlFor="cardName">Name:</label>
                    <input
                    className="bg-white rounded-md text-sm w-full"
                    required
                    id="cardName"
                    onChange={(e) => setCurrentName(e.target.value)}
                    />
                </div>
                <div className='flex flex-col gap-3'>
                    <label htmlFor="cardImage">URL:</label>
                    <input
                    type="url"
                    placeholder="(optional)"
                    className="bg-white rounded-md text-sm w-full"
                    id="cardImage"
                    value={!upload ? currentUrl : ''}
                    onChange={(e) => {
                            setCurrentUrl(e.target.value.trim());
                            setUpload(false);
                            clearUploadInput();
                        }
                    }
                    />
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer padding-s rounded-md light-blue blue-shade text-sm font-semibold">
                            Choose File
                            <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => uploadFile(e.target.files[0])}
                            />
                        </label>
                        <span className="text-sm">
                            {fileInputRef.current?.files[0]?.name || 'No file chosen'}
                        </span>
                    </div>
                </div>
                <button type="submit" className="group ">
                    Add to current set <span className="group-hover:hidden">⬦</span>
                    <span className="hidden group-hover:inline">⬥</span>
                </button>
            </form>
            <div></div>
            <div className="flex flex-row flex-wrap justify-around gap-5 w-130">
                {customCards.map((card, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <img
                      key={card.name}
                      className={`w-[80px] h-[80px] object-cover rounded-xl blue-border`}
                      src={card.image_url !== '' ? card.image_url : defaultCards[(index % 3) + 1]}
                    />
                    <p
                      key={index}
                      className={`text-sm group`}
                    >
                      {card.name} <span className="hidden group-hover:inline pink cursor-pointer" onClick={() => deleteCard(card.card_id)}>✘</span>
                    </p>
                  </div>
                ))}
            </div>
            <div></div>
            <button className='group yellow' onClick={addCustomSet}>Upload to private list <span className="group-hover:hidden">✧</span>
            <span className="hidden group-hover:inline">✦</span></button>
        </div>
    )
}
