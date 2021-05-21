pragma solidity ^0.5.1;

contract myContract{
    
    //create a model for center
    struct Center{
        uint id;
        string name;
        uint amount;
        address receiver;
    }
    mapping(uint => Center) private center;
    uint count;
    
    
    struct Update{
        uint id;
        string name;
        uint amount;
    }
    mapping(uint => Update) public update;
    uint countDown;
    
    //balance for authorized center
    uint balance1;
    uint balance2;
    uint balance3;
    uint balance4;
    
    mapping(address => bool) public distributors;

    
    
    // address of each center
    address A = 0x838C462aaE178549D01965aE7540e6372e90585a;
    address B = 0xAd48c1E101439848c0177FB734979861ACa5783D;
    address C = 0x7884Bafe0E6bf7FB39274fCC8841850cA88Cad9f;
    address D = 0xda3663C1d141a849eb9CB97349e0849B3A773900;
    
    address secretAddress;
    
    constructor()public{
        addCenter('Health Ministry', A);
        addCenter('Division', B);
        addCenter('Authorized Hospital', C);
        addCenter('Researcher', D);
        
        addMore('Health Ministry');
        addMore('Division');
        addMore('Authorized Hospital');
        addMore('Researcher');
        
        
    }
    //function for add centers
    function addCenter(string memory _name, address _receiver) private{
        count++;
        center[count] = Center(count,_name, 0, _receiver);
    }
    
    
    function addMore(string memory  _name) private{
        countDown++;
        update[countDown] = Update(countDown, _name, 0);
    }
    
    //sending ppe by distributor
    function sendPPE(uint _centerId, uint _amount) payable public{
        
        require(_centerId == 1 && _amount >= 100 && msg.sender != A && msg.sender != B && msg.sender != C && msg.sender != D);
        
        balance1+=_amount;
        
        distributors[msg.sender] = true;

        center[_centerId] = Center(_centerId, 'Health Ministry', balance1, A);
        update[_centerId].amount = balance1;
        
    }
    
    
    
    //sending by Health Ministry
    function sendToDivision(uint _centerId, uint _amount) payable public{
        require(_centerId == 2 && _amount <= balance1 && msg.sender == A);
        balance1 -= _amount;
        balance2 += _amount;
        
        distributors[msg.sender] = true;

        center[_centerId] = Center(_centerId, 'Division', balance2, B);
        
        update[1].amount = balance1;
        update[_centerId].amount = balance2;

    }
    
    //sending by Division
    function sendToAuthor(uint _centerId, uint _amount) payable public{
        require(_centerId >2 && _centerId <=4 && _amount <= balance2 && msg.sender == B);
        
        balance2 -= _amount;
        
        distributors[msg.sender] = true;
        
        if(_centerId == 3){

            balance3 += _amount;
            center[_centerId] = Center(_centerId, 'Authorized Hospital', balance3, C);
            
            update[2].amount = balance2;
 
            update[_centerId].amount = balance3;

        }
        
        if(_centerId == 4){

            balance4 += _amount;
            center[_centerId] = Center(_centerId, 'Researcher', balance4, D);
            
            update[2].amount = balance2;
 
            update[_centerId].amount = balance4;
 
            
        }
    }
    
    function withdraw(uint _centerId, address yourAddress, uint _amount) public{
        secretAddress = msg.sender;
    
        if(secretAddress != yourAddress){
            revert("you can't withdraw anything!");
        }
        
        if(_centerId == 3 && _amount <= balance3){
            balance3 -= _amount;
            update[_centerId].amount = balance3;

        }
        if(_centerId == 4 && _amount <= balance4){
            balance4 -= _amount;
            update[_centerId].amount = balance4;

        }
    }
    
    function getInfo(uint index) public view returns(uint, string memory, uint){
        return (center[index].id, center[index].name, center[index].amount);
    }
    
    function getInfo2(uint index) public view returns(uint, string memory, uint){
       
        return(update[index].id, update[index].name, update[index].amount);
    }
    
    
}