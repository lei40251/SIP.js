const clientdataback= {
    onResponse:(path,xhr) => {
      console.log("onResponse:"+path)
    },
  };
  function SetTrace()
  {
    const emps = getInput("emps");
    Client.SetGisTrace(emps.value);
  }
  function SetUnTrace()
  {
    const emps = getInput("emps");
    Client.SetGisUnTrace(emps.value);
  }
  function GetEmpsGisInfo()
  {
    const emps = getInput("emps");
    Client.GetEmpsGisInfo(emps.value);
  }
  function GetGroupTree()
  {
    Client.GetGroupTree();
  }
  function GetGroupMember()
  {
    const groupnum = getInput("groupnum");
    Client.GetGroupMember(groupnum.value,-1,"");
  }
  function QueryEmps()
  {
    const queryinfo = getInput("queryinfo");
    Client.QueryEmps(queryinfo.value);
  }
  function QueryEmpsByType()
  {
    Client.QueryEmpsByType(7);
  }



